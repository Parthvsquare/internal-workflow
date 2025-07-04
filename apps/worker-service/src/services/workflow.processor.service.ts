import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WorkflowConsumer } from '@internal-workflow/queue-v2';
import { WorkflowMessage } from '@internal-workflow/queue-v2';
import { WorkflowEngineService } from '@internal-workflow/workflow-engine';

@Injectable()
export class WorkflowProcessorService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowProcessorService.name);
  private readonly debeziumTopicPrefix =
    process.env['DEBEZIUM_TOPIC_PREFIX'] || 'dbserver1';

  constructor(
    private readonly workflowConsumer: WorkflowConsumer,
    private readonly workflowEngine: WorkflowEngineService
  ) {}

  async onModuleInit() {
    await this.startListening();
  }

  private async startListening() {
    this.logger.log(
      'Starting to listen for database changes and workflow triggers...'
    );

    // Get active trigger registries directly from the workflow engine
    const triggerRegistries =
      await this.workflowEngine.getActiveTriggerRegistries();

    // Collect all topics to subscribe to
    const topicsToSubscribe: string[] = [];

    // Add Debezium topics based on trigger registries
    for (const trigger of triggerRegistries) {
      if (trigger.event_source === 'debezium') {
        const topicName = this.getDebeziumTopicName(trigger);

        if (topicName) {
          this.logger.log(
            `Planning to subscribe to Debezium topic: ${topicName}`
          );
          topicsToSubscribe.push(topicName);
        }
      }
    }

    // Add workflow trigger topic
    topicsToSubscribe.push('workflow.trigger');

    // Subscribe to all topics at once
    for (const topic of topicsToSubscribe) {
      if (topic === 'workflow.trigger') {
        await this.workflowConsumer.subscribeToWorkflowTriggers(
          this.handleWorkflowTrigger.bind(this),
          topic
        );
      } else {
        // Pass the topic name to the handler so we can extract table name
        await this.workflowConsumer.subscribeToDatabaseChanges(
          (event) => this.handleDatabaseChangeWithTopic(event, topic),
          topic
        );
      }
    }

    // Start the consumer after all subscriptions are registered
    await this.workflowConsumer.startConsumer();
    this.logger.log('Workflow consumer started successfully');
  }

  private getDebeziumTopicName(trigger: any): string | null {
    // Extract table name from trigger properties or key
    // Assuming trigger key format: "table_name_table_change"

    if (trigger.key?.endsWith('_db_change')) {
      const tableName = trigger.key.replace('_db_change', '');

      const dbTableName = `${this.debeziumTopicPrefix}.public.${tableName}`;

      return dbTableName;
    }
    return null;
  }

  private async handleDatabaseChange(event: any) {
    this.logger.log(`Received database change event: ${JSON.stringify(event)}`);

    try {
      // Transform Debezium event to workflow trigger format
      const triggerData = this.transformDebeziumEvent(event);

      // Find workflows that should be triggered by this database change
      await this.triggerMatchingWorkflows(triggerData);
    } catch (error) {
      this.logger.error('Error processing database change:', error);
    }
  }

  private async handleDatabaseChangeWithTopic(event: any, topic: string) {
    this.logger.log(
      `Received database change event from topic ${topic}: ${JSON.stringify(
        event
      )}`
    );

    try {
      // Skip snapshot reads (only process actual data changes)
      if (event.__op === 'r') {
        this.logger.debug('Skipping snapshot read event');
        return;
      }

      // Extract table name from topic (e.g., "dbserver1.public.lead_sources" -> "lead_sources")
      const tableName = topic.split('.').pop() || 'unknown';

      // Transform Debezium event to workflow trigger format
      const triggerData = this.transformDebeziumEventWithTable(
        event,
        tableName
      );

      this.logger.log(
        `Transformed trigger data: ${JSON.stringify(triggerData)}`
      );

      // Use the workflow engine directly instead of HTTP calls
      await this.triggerMatchingWorkflows(triggerData);
    } catch (error) {
      this.logger.error('Error processing database change:', error);
    }
  }

  private async handleWorkflowTrigger(message: WorkflowMessage) {
    this.logger.log(`Received workflow trigger: ${JSON.stringify(message)}`);

    try {
      // Execute the workflow using the workflow engine directly
      const result = await this.workflowEngine.executeWorkflow(
        message.payload.workflowId,
        {
          triggerData: message.payload.triggerData,
          triggerType: 'manual',
          executionMode: 'async',
        }
      );

      this.logger.log(`Workflow execution result: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Error processing workflow trigger:', error);
    }
  }

  private transformDebeziumEvent(event: any): any {
    // Transform Debezium CDC event to workflow trigger format
    // Debezium flattened event structure: { __op: 'c'|'u'|'d', __ts_ms: number, field1: value1, field2: value2, ... }
    const operationMap = { c: 'INSERT', u: 'UPDATE', d: 'DELETE', r: 'READ' };

    // Extract the data fields (non-meta fields that don't start with __)
    const dataFields: Record<string, any> = {};
    const metaFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(event)) {
      if (key.startsWith('__')) {
        metaFields[key] = value;
      } else {
        dataFields[key] = value;
      }
    }

    // For updates, we need to determine before/after from the event
    const operation =
      operationMap[event.__op as keyof typeof operationMap] || 'UNKNOWN';

    return {
      operation,
      table: 'lead_sources', // TODO: Extract from topic name
      timestamp: event.__ts_ms
        ? new Date(event.__ts_ms).toISOString()
        : new Date().toISOString(),
      // For flattened format, the current data is the "after" state
      before: operation === 'INSERT' ? null : {}, // We don't have before state in flattened format
      after: dataFields,
      metadata: {
        ...metaFields,
        debezium_format: 'flattened',
      },
    };
  }

  private transformDebeziumEventWithTable(event: any, tableName: string): any {
    // Transform Debezium CDC event to workflow trigger format with table name
    const operationMap = { c: 'INSERT', u: 'UPDATE', d: 'DELETE', r: 'READ' };

    // Extract the data fields (non-meta fields that don't start with __)
    const dataFields: Record<string, any> = {};
    const metaFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(event)) {
      if (key.startsWith('__')) {
        metaFields[key] = value;
      } else {
        dataFields[key] = value;
      }
    }

    const operation =
      operationMap[event.__op as keyof typeof operationMap] || 'UNKNOWN';

    return {
      operation,
      table: tableName,
      timestamp: event.__ts_ms
        ? new Date(event.__ts_ms).toISOString()
        : new Date().toISOString(),
      before: operation === 'INSERT' ? null : {},
      after: dataFields,
      metadata: {
        ...metaFields,
        debezium_format: 'flattened',
        topic: `${this.debeziumTopicPrefix}.public.${tableName}`,
      },
    };
  }

  private async triggerMatchingWorkflows(triggerData: any) {
    try {
      // Generate a unique trigger event ID for this specific trigger
      const trigger_event_id = `debezium_${
        triggerData.table
      }_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use the workflow engine directly instead of HTTP calls
      const result = await this.workflowEngine.processTriggerEvent(
        `${triggerData.table}_db_change`,
        triggerData,
        {
          trigger_event_id: trigger_event_id,
          // timestamp: triggerData.timestamp,
        }
      );

      this.logger.log(`Triggered workflows: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Error triggering workflows:', error);
    }
  }
}
