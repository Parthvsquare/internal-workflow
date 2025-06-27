import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTriggerRegistryEntity } from '@internal-workflow/storage';
import {
  WorkflowFilterService,
  FilterCondition,
  FilterGroup,
} from './workflow-filter.service';

export interface TriggerEvent {
  id: string;
  source: string;
  eventType: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WebhookEvent extends TriggerEvent {
  headers: Record<string, string>;
  url: string;
  method: string;
}

export interface DatabaseChangeEvent extends TriggerEvent {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  before?: any;
  after?: any;
  changedFields?: string[];
}

@Injectable()
export class WorkflowTriggerProcessor {
  private readonly logger = new Logger(WorkflowTriggerProcessor.name);

  constructor(
    @InjectRepository(WorkflowTriggerRegistryEntity)
    private readonly triggerRegistry: Repository<WorkflowTriggerRegistryEntity>,
    private readonly filterService: WorkflowFilterService
  ) {}

  /**
   * Process and determine if a trigger should fire
   */
  async shouldTrigger(
    triggerKey: string,
    event: TriggerEvent,
    triggerConfig?: any
  ): Promise<boolean> {
    try {
      // Get trigger registry
      const trigger = await this.triggerRegistry.findOne({
        where: { key: triggerKey, is_active: true },
      });

      if (!trigger) {
        this.logger.warn(`Trigger not found: ${triggerKey}`);
        return false;
      }

      // Apply trigger-specific filtering
      if (trigger.event_source === 'webhook') {
        return await this.processWebhookTrigger(
          trigger,
          event as WebhookEvent,
          triggerConfig
        );
      } else if (trigger.event_source === 'debezium') {
        return await this.processDatabaseChangeTrigger(
          trigger,
          event as DatabaseChangeEvent,
          triggerConfig
        );
      }

      // Default filtering using filter schema
      if (trigger.filter_schema) {
        return await this.filterService.evaluateFilter(
          trigger.filter_schema as FilterCondition | FilterGroup,
          event.data
        );
      }

      return true;
    } catch (error) {
      this.logger.error(`Trigger evaluation failed for ${triggerKey}:`, error);
      return false;
    }
  }

  /**
   * Process webhook trigger
   */
  async processWebhookTrigger(
    trigger: WorkflowTriggerRegistryEntity,
    event: WebhookEvent,
    triggerConfig?: any
  ): Promise<boolean> {
    try {
      // Check webhook configuration if exists
      const webhookConfig = trigger.webhook_config;

      if (webhookConfig) {
        // Check URL pattern
        if (
          webhookConfig.urlPattern &&
          !this.matchesUrlPattern(event.url, webhookConfig.urlPattern)
        ) {
          return false;
        }

        // Check HTTP method
        if (
          webhookConfig.methods &&
          !webhookConfig.methods.includes(event.method)
        ) {
          return false;
        }

        // Check required headers
        if (webhookConfig.requiredHeaders) {
          for (const [headerName, expectedValue] of Object.entries(
            webhookConfig.requiredHeaders
          )) {
            const actualValue = event.headers[headerName.toLowerCase()];
            if (!actualValue || actualValue !== expectedValue) {
              return false;
            }
          }
        }

        // Verify webhook signature if configured
        if (webhookConfig.signatureHeader && webhookConfig.secretKey) {
          const isValidSignature = this.verifyWebhookSignature(
            event,
            webhookConfig.signatureHeader,
            webhookConfig.secretKey
          );
          if (!isValidSignature) {
            this.logger.warn(
              `Invalid webhook signature for trigger: ${trigger.key}`
            );
            return false;
          }
        }
      }

      // Apply filter schema if exists
      if (trigger.filter_schema) {
        return await this.filterService.evaluateFilter(
          trigger.filter_schema as FilterCondition | FilterGroup,
          event.data
        );
      }

      return true;
    } catch (error) {
      this.logger.error(`Webhook trigger processing failed:`, error);
      return false;
    }
  }

  /**
   * Process database change trigger from Debezium CDC
   */
  async processDatabaseChangeTrigger(
    trigger: WorkflowTriggerRegistryEntity,
    event: DatabaseChangeEvent,
    triggerConfig?: any
  ): Promise<boolean> {
    try {
      const properties = trigger.properties_schema;

      if (properties) {
        // Check table name filter
        const tableNameConfig = this.getPropertyConfig(
          properties,
          'table_name'
        );
        if (tableNameConfig && tableNameConfig.value !== event.table) {
          return false;
        }

        // Check change type filter
        const changeTypeConfig = this.getPropertyConfig(
          properties,
          'change_type'
        );
        if (changeTypeConfig && changeTypeConfig.value) {
          const allowedOperations = Array.isArray(changeTypeConfig.value)
            ? changeTypeConfig.value
            : [changeTypeConfig.value];

          if (!allowedOperations.includes(event.operation)) {
            return false;
          }
        }

        // Check monitored fields for UPDATE operations
        if (event.operation === 'UPDATE') {
          const monitorFieldsConfig = this.getPropertyConfig(
            properties,
            'monitor_fields'
          );
          if (
            monitorFieldsConfig &&
            monitorFieldsConfig.value &&
            Array.isArray(monitorFieldsConfig.value)
          ) {
            const monitoredFields = monitorFieldsConfig.value;
            const hasMonitoredFieldChange = monitoredFields.some(
              (field: string) => event.changedFields?.includes(field)
            );

            if (!hasMonitoredFieldChange) {
              return false;
            }
          }

          // Check status change detection
          const statusChangeOnlyConfig = this.getPropertyConfig(
            properties,
            'status_change_only'
          );
          if (statusChangeOnlyConfig && statusChangeOnlyConfig.value === true) {
            if (!event.changedFields?.includes('status')) {
              return false;
            }

            // Ensure status actually changed value
            if (event.before?.status === event.after?.status) {
              return false;
            }
          }
        }
      }

      // Transform CDC event to standard format for filter evaluation
      const transformedData = this.transformCdcEventForFilters(event);

      // Apply filter schema if exists
      if (trigger.filter_schema) {
        return await this.filterService.evaluateFilter(
          trigger.filter_schema as FilterCondition | FilterGroup,
          transformedData
        );
      }

      return true;
    } catch (error) {
      this.logger.error(`Database change trigger processing failed:`, error);
      return false;
    }
  }

  /**
   * Transform CDC event to format expected by filters
   */
  private transformCdcEventForFilters(
    event: DatabaseChangeEvent
  ): Record<string, any> {
    return {
      operation_type: event.operation,
      table_name: event.table,
      before: event.before || {},
      after: event.after || {},
      // Flatten after values for easier filtering
      after_status: event.after?.status,
      after_assigned_to: event.after?.assigned_to,
      after_source: event.after?.source,
      after_name: event.after?.name,
      after_email: event.after?.email,
      after_phone: event.after?.phone,
      after_company: event.after?.company,
      after_lead_score: event.after?.lead_score,
      // Flatten before values for easier filtering
      before_status: event.before?.status,
      before_assigned_to: event.before?.assigned_to,
      before_source: event.before?.source,
      before_name: event.before?.name,
      before_email: event.before?.email,
      before_phone: event.before?.phone,
      before_company: event.before?.company,
      before_lead_score: event.before?.lead_score,
      // Additional metadata
      changed_fields: event.changedFields || [],
      timestamp: event.timestamp,
    };
  }

  /**
   * Get property configuration by name
   */
  private getPropertyConfig(properties: any, propertyName: string): any {
    if (Array.isArray(properties)) {
      return properties.find((prop) => prop.name === propertyName);
    }
    return properties[propertyName];
  }

  /**
   * Check if URL matches pattern (supports wildcards)
   */
  private matchesUrlPattern(url: string, pattern: string): boolean {
    // Convert pattern to regex (simple wildcard support)
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(
    event: WebhookEvent,
    signatureHeader: string,
    secretKey: string
  ): boolean {
    // TODO: Implement signature verification based on webhook provider
    // Different providers use different signing methods (HMAC-SHA256, etc.)

    const signature = event.headers[signatureHeader.toLowerCase()];
    if (!signature) {
      return false;
    }

    // Placeholder implementation - you'll need to implement based on your webhook providers
    // Example for GitHub-style webhooks:
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', secretKey)
    //   .update(JSON.stringify(event.data))
    //   .digest('hex');
    // return signature === `sha256=${expectedSignature}`;

    this.logger.debug('Webhook signature verification not implemented');
    return true; // For now, always return true
  }

  /**
   * Create trigger event from raw data
   */
  createTriggerEvent(
    source: string,
    eventType: string,
    data: any,
    metadata?: Record<string, any>
  ): TriggerEvent {
    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      eventType,
      data,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Create webhook event from HTTP request data
   */
  createWebhookEvent(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    eventType?: string
  ): WebhookEvent {
    const baseEvent = this.createTriggerEvent(
      'webhook',
      eventType || 'webhook_received',
      body
    );

    return {
      ...baseEvent,
      headers,
      url,
      method,
    };
  }

  /**
   * Create database change event from Debezium CDC payload
   */
  createDatabaseChangeEvent(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    before: any,
    after: any,
    changedFields?: string[]
  ): DatabaseChangeEvent {
    const baseEvent = this.createTriggerEvent(
      'debezium',
      `database_${operation.toLowerCase()}`,
      { before, after }
    );

    return {
      ...baseEvent,
      table,
      operation,
      before,
      after,
      changedFields,
    };
  }

  /**
   * Extract changed fields from before/after comparison
   */
  extractChangedFields(before: any, after: any): string[] {
    if (!before || !after) return [];

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
   * Validate trigger configuration
   */
  async validateTriggerConfig(
    triggerKey: string,
    config: any
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const trigger = await this.triggerRegistry.findOne({
        where: { key: triggerKey },
      });

      if (!trigger) {
        errors.push(`Trigger not found: ${triggerKey}`);
        return { valid: false, errors };
      }

      // Validate based on trigger type
      if (trigger.event_source === 'webhook') {
        this.validateWebhookConfig(config, errors);
      } else if (trigger.event_source === 'debezium') {
        this.validateDatabaseChangeConfig(config, errors);
      }

      // Validate filter schema if provided
      if (
        config.filters &&
        !this.filterService.validateFilter(config.filters)
      ) {
        errors.push('Invalid filter configuration');
      }
    } catch (error) {
      errors.push(
        `Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate webhook configuration
   */
  private validateWebhookConfig(config: any, errors: string[]): void {
    if (config.urlPattern && typeof config.urlPattern !== 'string') {
      errors.push('URL pattern must be a string');
    }

    if (
      config.methods &&
      (!Array.isArray(config.methods) ||
        !config.methods.every((m: any) => typeof m === 'string'))
    ) {
      errors.push('Methods must be an array of strings');
    }

    if (config.requiredHeaders && typeof config.requiredHeaders !== 'object') {
      errors.push('Required headers must be an object');
    }
  }

  /**
   * Validate database change configuration
   */
  private validateDatabaseChangeConfig(config: any, errors: string[]): void {
    if (config.tableName && typeof config.tableName !== 'string') {
      errors.push('Table name must be a string');
    }

    if (
      config.operations &&
      (!Array.isArray(config.operations) ||
        !config.operations.every((op: any) =>
          ['INSERT', 'UPDATE', 'DELETE'].includes(op)
        ))
    ) {
      errors.push(
        'Operations must be an array containing INSERT, UPDATE, or DELETE'
      );
    }

    if (
      config.monitoredFields &&
      (!Array.isArray(config.monitoredFields) ||
        !config.monitoredFields.every(
          (field: any) => typeof field === 'string'
        ))
    ) {
      errors.push('Monitored fields must be an array of strings');
    }
  }
}
