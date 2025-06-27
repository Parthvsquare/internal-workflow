import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class WorkflowKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkflowKafkaConsumer.name);
  private isRunning = false;

  // No dependencies needed for now

  async onModuleInit() {
    // Start consuming messages when the module initializes
    await this.startConsumer();
  }

  async onModuleDestroy() {
    // Stop consuming when the module is destroyed
    await this.stopConsumer();
  }

  /**
   * Start the Kafka consumer
   */
  async startConsumer(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Consumer is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('Starting Kafka consumer for workflow triggers');

      // TODO: Implement actual Kafka consumer using @nestjs/microservices or kafkajs
      // For now, this is a placeholder that demonstrates the pattern
      // This will consume Debezium CDC events and trigger workflows

      this.logger.log('Kafka consumer started successfully');
    } catch (error) {
      this.logger.error('Failed to start Kafka consumer:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the Kafka consumer
   */
  async stopConsumer(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.isRunning = false;
      this.logger.log('Stopping Kafka consumer');

      this.logger.log('Kafka consumer stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping Kafka consumer:', error);
    }
  }

  /**
   * Process incoming Kafka message
   */
  async processMessage(topic: string, message: any): Promise<void> {
    try {
      const messageValue = JSON.parse(message.value.toString());

      if (topic.includes('dbserver1.public.leads')) {
        // Handle Debezium CDC events for lead table
        await this.processLeadDatabaseChange(messageValue);
      } else if (topic.includes('workflow.webhooks')) {
        // Handle webhook events
        await this.processWebhookEvent(messageValue);
      } else {
        this.logger.debug(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from topic ${topic}:`, error);
    }
  }

  /**
   * Process Debezium CDC events for lead database changes
   */
  async processLeadDatabaseChange(cdcPayload: any): Promise<void> {
    try {
      this.logger.log('Processing lead database change event');

      // Transform Debezium payload to standard format
      const event = this.transformDebeziumPayload(cdcPayload);

      if (!event) {
        return; // Skip invalid payloads
      }

      // TODO: Call workflow engine API to process trigger
      // For now, we'll log the event for processing
      this.logger.log(
        'Workflow trigger event:',
        JSON.stringify({
          triggerKey: 'lead_database_change',
          event,
          context: {
            userId: 'system',
            tenantId: cdcPayload.source?.database || 'default',
          },
        })
      );

      this.logger.log(
        `Processed lead database change: ${event.operation} on ${event.table}`
      );
    } catch (error) {
      this.logger.error('Error processing lead database change:', error);
    }
  }

  /**
   * Process webhook events
   */
  async processWebhookEvent(webhookPayload: any): Promise<void> {
    try {
      const event = {
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'webhook',
        eventType: 'webhook_received',
        data: webhookPayload.body || webhookPayload,
        timestamp: new Date(),
        headers: webhookPayload.headers || {},
        url: webhookPayload.url || '',
        method: webhookPayload.method || 'POST',
      };

      this.logger.log(`Processing webhook event: ${event.method} ${event.url}`);

      // Determine webhook trigger key based on URL or headers
      const triggerKey = this.determineTriggerKey(event);

      if (triggerKey) {
        this.logger.log(
          'Webhook trigger event:',
          JSON.stringify({
            triggerKey,
            event,
          })
        );
      } else {
        this.logger.warn('No trigger key determined for webhook event');
      }
    } catch (error) {
      this.logger.error('Error processing webhook event:', error);
    }
  }

  /**
   * Transform Debezium CDC payload to our standard format
   */
  private transformDebeziumPayload(payload: any): any | null {
    try {
      if (!payload.payload) {
        return null;
      }

      const { op, before, after, source } = payload.payload;

      // Map Debezium operation to our format
      let operation: 'INSERT' | 'UPDATE' | 'DELETE';
      switch (op) {
        case 'c':
          operation = 'INSERT';
          break;
        case 'u':
          operation = 'UPDATE';
          break;
        case 'd':
          operation = 'DELETE';
          break;
        default:
          this.logger.warn(`Unknown Debezium operation: ${op}`);
          return null;
      }

      // Extract changed fields for UPDATE operations
      const changedFields =
        operation === 'UPDATE' ? this.extractChangedFields(before, after) : [];

      return {
        table: source.table,
        operation,
        before,
        after,
        changedFields,
        transactionId: payload.payload.ts_ms?.toString() || 'unknown',
        timestamp: new Date(payload.payload.ts_ms || Date.now()),
        metadata: {
          connector: source.name,
          topic: `${source.db}.${source.schema}.${source.table}`,
          offset: payload.offset,
          partition: payload.partition,
        },
      };
    } catch (error) {
      this.logger.error('Error transforming Debezium payload:', error);
      return null;
    }
  }

  /**
   * Extract changed fields from before/after data
   */
  private extractChangedFields(before: any, after: any): string[] {
    if (!before || !after) {
      return [];
    }

    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Determine trigger key from webhook event
   */
  private determineTriggerKey(event: any): string | null {
    // Example logic to determine trigger key from webhook URL or headers
    if (event.url.includes('/webhook/lead-update')) {
      return 'lead_database_change';
    }

    if (event.headers['x-webhook-trigger']) {
      return event.headers['x-webhook-trigger'] as string;
    }

    return null;
  }

  /**
   * Simulate a CDC event for testing
   */
  async testCdcEvent(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    before: any = null,
    after: any = null
  ): Promise<void> {
    const mockPayload = {
      payload: {
        op: operation === 'INSERT' ? 'c' : operation === 'UPDATE' ? 'u' : 'd',
        before,
        after,
        source: { table, database: 'test_db', name: 'test-connector' },
        ts_ms: Date.now(),
      },
      offset: 123,
      partition: 0,
    };

    await this.processLeadDatabaseChange(mockPayload);
  }

  /**
   * Get consumer status
   */
  getStatus(): { running: boolean; uptime?: number } {
    return {
      running: this.isRunning,
    };
  }
}
