import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WorkflowConsumer } from '@internal-workflow/queue-v2';
import {
  DatabaseChangeEvent,
  WorkflowMessage,
} from '@internal-workflow/queue-v2';

@Injectable()
export class WorkflowProcessorService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowProcessorService.name);
  private readonly workflowEngineUrl = 'http://localhost:3000';
  private readonly debeziumTopicPrefix =
    process.env['DEBEZIUM_TOPIC_PREFIX'] || 'dbserver1';

  constructor(private readonly workflowConsumer: WorkflowConsumer) {}

  async onModuleInit() {
    await this.startListening();
  }

  private async startListening() {
    this.logger.log(
      'Starting to listen for database changes and workflow triggers...'
    );

    // Get active trigger registries to determine which topics to subscribe to
    const triggerRegistries = await this.loadTriggerRegistries();

    console.log(
      '===> ~ WorkflowProcessorService ~ startListening ~ triggerRegistries:',
      triggerRegistries
    );

    // Collect all topics to subscribe to
    const topicsToSubscribe: string[] = [];

    // Add Debezium topics based on trigger registries
    for (const trigger of triggerRegistries) {
      if (trigger.eventSource === 'debezium') {
        const topicName = this.getDebeziumTopicName(trigger);

        console.log(
          '===> ~ WorkflowProcessorService ~ startListening ~ topicName:',
          topicName
        );

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

  private async loadTriggerRegistries(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.workflowEngineUrl}/api/workflow-registry/triggers?active=true`
      );
      const triggerRegistries = (await response.json()) as any[];
      this.logger.log(
        `Loaded ${triggerRegistries.length} active trigger registries`
      );
      return triggerRegistries;
    } catch (error) {
      this.logger.error('Failed to load trigger registries:', error);
      return [];
    }
  }

  private getDebeziumTopicName(trigger: any): string | null {
    // Extract table name from trigger properties or key
    // Assuming trigger key format: "table_name_table_change"

    console.log(
      '===> ~ WorkflowProcessorService ~ getDebeziumTopicName ~ trigger:',
      trigger
    );

    if (trigger.key?.endsWith('_db_change')) {
      const tableName = trigger.key.replace('_db_change', '');

      console.log(
        '===> ~ WorkflowProcessorService ~ getDebeziumTopicName ~ tableName:',
        tableName
      );

      const dbTableName = `${this.debeziumTopicPrefix}.public.${tableName}`;

      console.log(
        '===> ~ WorkflowProcessorService ~ getDebeziumTopicName ~ dbTableName:',
        dbTableName
      );

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

      // Find workflows that should be triggered by this database change
      await this.triggerMatchingWorkflows(triggerData);
    } catch (error) {
      this.logger.error('Error processing database change:', error);
    }
  }

  private async handleWorkflowTrigger(message: WorkflowMessage) {
    this.logger.log(`Received workflow trigger: ${JSON.stringify(message)}`);

    try {
      // Execute the workflow
      await this.executeWorkflow(message.payload);
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
      // Call the workflow engine API to find and trigger matching workflows
      const response = await fetch(
        `${this.workflowEngineUrl}/api/workflow-registry/trigger/${triggerData.table}_db_change`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventData: triggerData,
            context: {
              source: 'debezium',
              timestamp: triggerData.timestamp,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.logger.log(`Triggered workflows: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Error triggering workflows:', error);
    }
  }

  private async executeWorkflow(payload: any) {
    try {
      const response = await fetch(
        `${this.workflowEngineUrl}/api/workflows/${payload.workflowId}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            triggerData: payload.triggerData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.logger.log(`Workflow execution result: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('Error executing workflow:', error);
    }
  }
}
