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
        await this.workflowConsumer.subscribeToDatabaseChanges(
          this.handleDatabaseChange.bind(this),
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

  private async handleDatabaseChange(event: DatabaseChangeEvent) {
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

  private async handleWorkflowTrigger(message: WorkflowMessage) {
    this.logger.log(`Received workflow trigger: ${JSON.stringify(message)}`);

    try {
      // Execute the workflow
      await this.executeWorkflow(message.payload);
    } catch (error) {
      this.logger.error('Error processing workflow trigger:', error);
    }
  }

  private transformDebeziumEvent(event: DatabaseChangeEvent): any {
    // Transform Debezium CDC event to workflow trigger format
    // Debezium event structure: { op: 'c'|'u'|'d', before: {...}, after: {...}, source: {...}, ts_ms: number }
    const operationMap = { c: 'INSERT', u: 'UPDATE', d: 'DELETE' };

    return {
      operation:
        operationMap[event.op as keyof typeof operationMap] || event.operation,
      table: event.source?.table || event.table,
      timestamp: event.ts_ms
        ? new Date(event.ts_ms).toISOString()
        : event.eventTimestamp,
      before: event.before,
      after: event.after,
      metadata: {
        source: event.source,
        ts_ms: event.ts_ms,
        ...event.metadata,
      },
    };
  }

  private async triggerMatchingWorkflows(triggerData: any) {
    try {
      // Call the workflow engine API to find and trigger matching workflows
      const response = await fetch(
        `${this.workflowEngineUrl}/api/workflow-registry/trigger/${triggerData.table}_table_change`,
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
