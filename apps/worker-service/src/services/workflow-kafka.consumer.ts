import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
// Note: HttpService would need to be properly configured in the module
// For now, using fetch for HTTP calls

interface TriggerRegistryItem {
  key: string;
  name: string;
  category: string;
  event_source: string;
  properties_schema: any;
  webhook_config: any;
  is_active: boolean;
}

@Injectable()
export class WorkflowKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkflowKafkaConsumer.name);
  private isRunning = false;
  private readonly workflowEngineUrl =
    process.env.WORKFLOW_ENGINE_URL || 'http://localhost:3000';
  private readonly apiUrl = process.env.API_URL || 'http://localhost:3000';
  private triggerRegistries: TriggerRegistryItem[] = [];

  async onModuleInit() {
    // Load trigger registries and start consumer
    await this.loadTriggerRegistries();
    await this.startConsumer();
  }

  async onModuleDestroy() {
    // Stop consuming when the module is destroyed
    await this.stopConsumer();
  }

  /**
   * Load all active trigger registries from API
   */
  async loadTriggerRegistries(): Promise<void> {
    try {
      this.logger.log('Loading trigger registries...');

      const response = await fetch(
        `${this.apiUrl}/api/workflow-registry/triggers`
      );
      const data = (await response.json()) as TriggerRegistryItem[];

      this.triggerRegistries = data.filter(
        (trigger: TriggerRegistryItem) => trigger.is_active
      );

      this.logger.log(
        `Loaded ${this.triggerRegistries.length} active trigger registries`
      );
    } catch (error) {
      this.logger.error('Failed to load trigger registries:', error);
      this.triggerRegistries = [];
    }
  }

  /**
   * Start the Kafka consumer dynamically based on trigger registries
   */
  async startConsumer(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Consumer is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('Starting dynamic Kafka consumer for workflow triggers');

      // TODO: Implement actual Kafka consumer that subscribes to topics based on trigger registries
      // For now, this is a placeholder that demonstrates the dynamic pattern

      this.logger.log('Dynamic Kafka consumer started successfully');
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
   * Process incoming Kafka message dynamically
   */
  async processMessage(topic: string, message: any): Promise<void> {
    try {
      const messageValue = JSON.parse(message.value.toString());

      // Find matching trigger registries for this topic/event
      const matchingTriggers = this.findMatchingTriggers(topic, messageValue);

      for (const trigger of matchingTriggers) {
        await this.processTriggerEvent(trigger, messageValue);
      }

      if (matchingTriggers.length === 0) {
        this.logger.debug(`No matching triggers found for topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from topic ${topic}:`, error);
    }
  }

  /**
   * Find trigger registries that match the incoming event
   */
  private findMatchingTriggers(
    topic: string,
    messageValue: any
  ): TriggerRegistryItem[] {
    return this.triggerRegistries.filter((trigger) => {
      // Match by event source
      if (
        trigger.event_source === 'debezium' &&
        this.isDebeziumEvent(topic, messageValue)
      ) {
        return this.matchesDebeziumTrigger(trigger, topic, messageValue);
      }

      if (
        trigger.event_source === 'webhook' &&
        this.isWebhookEvent(topic, messageValue)
      ) {
        return this.matchesWebhookTrigger(trigger, topic, messageValue);
      }

      return false;
    });
  }

  /**
   * Check if event is a Debezium CDC event
   */
  private isDebeziumEvent(topic: string, messageValue: any): boolean {
    return (
      messageValue.payload &&
      messageValue.payload.source &&
      messageValue.payload.op
    );
  }

  /**
   * Check if event is a webhook event
   */
  private isWebhookEvent(topic: string, messageValue: any): boolean {
    return (
      topic.includes('webhook') || messageValue.headers || messageValue.url
    );
  }

  /**
   * Check if Debezium event matches trigger configuration
   */
  private matchesDebeziumTrigger(
    trigger: TriggerRegistryItem,
    topic: string,
    messageValue: any
  ): boolean {
    const properties = trigger.properties_schema;
    if (!properties) return false;

    // Check table name if specified in trigger properties
    const tableName = properties.find(
      (prop: any) => prop.name === 'table_name'
    );
    if (tableName && tableName.default) {
      const sourceTable = messageValue.payload?.source?.table;
      if (sourceTable !== tableName.default) {
        return false;
      }
    }

    // Check change type if specified
    const changeType = properties.find(
      (prop: any) => prop.name === 'change_type'
    );
    if (changeType && changeType.default) {
      const operation = this.mapDebeziumOperation(messageValue.payload?.op);
      if (!changeType.default.includes(operation)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if webhook event matches trigger configuration
   */
  private matchesWebhookTrigger(
    trigger: TriggerRegistryItem,
    topic: string,
    messageValue: any
  ): boolean {
    const webhookConfig = trigger.webhook_config;
    if (!webhookConfig) return true; // Match all webhooks if no config

    // Check HTTP methods if specified
    if (webhookConfig.methods && messageValue.method) {
      return webhookConfig.methods.includes(messageValue.method);
    }

    return true;
  }

  /**
   * Process a specific trigger event
   */
  private async processTriggerEvent(
    trigger: TriggerRegistryItem,
    messageValue: any
  ): Promise<void> {
    try {
      this.logger.log(`Processing trigger: ${trigger.key}`);

      // Transform message based on event source
      let eventData;
      if (trigger.event_source === 'debezium') {
        eventData = this.transformDebeziumPayload(messageValue);
      } else if (trigger.event_source === 'webhook') {
        eventData = this.transformWebhookPayload(messageValue);
      } else {
        eventData = messageValue;
      }

      if (!eventData) {
        this.logger.warn(
          `Failed to transform event for trigger: ${trigger.key}`
        );
        return;
      }

      // Call workflow engine API to process trigger
      await this.triggerWorkflow(trigger.key, eventData, {
        triggerName: trigger.name,
        eventSource: trigger.event_source,
      });
    } catch (error) {
      this.logger.error(`Error processing trigger ${trigger.key}:`, error);
    }
  }

  /**
   * Call workflow engine API to trigger workflows
   */
  private async triggerWorkflow(
    triggerKey: string,
    eventData: any,
    context: any = {}
  ): Promise<void> {
    try {
      const url = `${this.workflowEngineUrl}/api/workflow-registry/trigger/${triggerKey}`;

      const payload = {
        eventData,
        context,
      };

      this.logger.log(`Calling workflow engine: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      this.logger.log(`Workflow engine response:`, responseData);
    } catch (error) {
      this.logger.error(
        `Failed to call workflow engine for trigger ${triggerKey}:`,
        error
      );
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
      const operation = this.mapDebeziumOperation(op);
      if (!operation) {
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
          connector: source.connector,
          topic: `${source.db}.${source.schema}.${source.table}`,
          partition: payload.partition || 0,
          offset: payload.offset || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error transforming Debezium payload:', error);
      return null;
    }
  }

  /**
   * Transform webhook payload to standard format
   */
  private transformWebhookPayload(payload: any): any {
    return {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'webhook',
      eventType: 'webhook_received',
      data: payload.body || payload,
      timestamp: new Date(),
      headers: payload.headers || {},
      url: payload.url || '',
      method: payload.method || 'POST',
    };
  }

  /**
   * Map Debezium operation codes to readable format
   */
  private mapDebeziumOperation(op: string): string | null {
    switch (op) {
      case 'c':
        return 'INSERT';
      case 'u':
        return 'UPDATE';
      case 'd':
        return 'DELETE';
      default:
        this.logger.warn(`Unknown Debezium operation: ${op}`);
        return null;
    }
  }

  /**
   * Extract changed fields from before/after comparison
   */
  private extractChangedFields(before: any, after: any): string[] {
    if (!before || !after) return [];

    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (before[key] !== after[key]) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Reload trigger registries (useful for dynamic updates)
   */
  async reloadTriggerRegistries(): Promise<void> {
    await this.loadTriggerRegistries();
    this.logger.log('Trigger registries reloaded');
  }

  /**
   * Test method to simulate any CDC event dynamically
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
        source: {
          table,
          connector: 'test-connector',
          db: 'testdb',
          schema: 'public',
        },
        ts_ms: Date.now(),
      },
    };

    const topic = `testdb.public.${table}`;
    await this.processMessage(topic, { value: JSON.stringify(mockPayload) });
  }

  /**
   * Get consumer status
   */
  getStatus(): { running: boolean; registries: number } {
    return {
      running: this.isRunning,
      registries: this.triggerRegistries.length,
    };
  }
}
