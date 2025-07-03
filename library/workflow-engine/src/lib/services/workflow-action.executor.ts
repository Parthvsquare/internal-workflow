import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowContext,
  ExecutionResult,
} from '../interfaces/workflow.interfaces';
import {
  TaskEntity,
  TaskStatus,
  TaskRelatedEntityType,
  WorkflowActionRegistryEntity,
} from '@internal-workflow/storage';

@Injectable()
export class WorkflowActionExecutor {
  private readonly logger = new Logger(WorkflowActionExecutor.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(WorkflowActionRegistryEntity)
    private readonly actionRegistry: Repository<WorkflowActionRegistryEntity>
  ) {}

  async executeAction(
    actionKey: string,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Executing action: ${actionKey}`);

    try {
      // Load action registry to get execution configuration
      const actionRegistry = await this.actionRegistry.findOne({
        where: { key: actionKey, is_active: true },
      });

      if (!actionRegistry) {
        return {
          success: false,
          error: `Action registry not found: ${actionKey}`,
        };
      }

      // Dynamic action execution based on registry configuration
      return await this.executeRegistryAction(actionRegistry, config, context);
    } catch (error) {
      this.logger.error(`Action execution failed: ${actionKey}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute action based on registry configuration
   * This allows for completely dynamic action execution without code changes
   */
  private async executeRegistryAction(
    actionRegistry: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const { execution_type, key } = actionRegistry;

    // Replace template variables in config
    const processedConfig = this.processConfigVariables(config, context);

    switch (execution_type) {
      case 'internal_function':
        return await this.executeInternalFunction(
          actionRegistry,
          processedConfig,
          context
        );
      case 'external_api':
        return await this.executeExternalApi(
          actionRegistry,
          processedConfig,
          context
        );
      case 'conditional':
        return await this.executeConditional(
          actionRegistry,
          processedConfig,
          context
        );
      default:
        // Fallback to legacy hardcoded actions for backward compatibility
        return await this.executeLegacyAction(key, processedConfig, context);
    }
  }

  /**
   * Execute internal functions (like task management, SMS, email)
   */
  private async executeInternalFunction(
    actionRegistry: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const { key } = actionRegistry;

    switch (key) {
      case 'task_management':
        return await this.executeTaskManagement(config, context);
      case 'send_email':
        return await this.executeSendEmail(config, context);
      case 'send_sms':
        return await this.executeSendSms(config, context);
      default:
        return {
          success: false,
          error: `Unknown internal function: ${key}`,
        };
    }
  }

  /**
   * Execute external API calls (future implementation)
   */
  private async executeExternalApi(
    actionRegistry: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement dynamic external API execution
    // This would use the action registry's operation_schema and credentials_schema
    return {
      success: true,
      result: { message: 'External API execution not yet implemented', config },
    };
  }

  /**
   * Execute conditional logic (future implementation)
   */
  private async executeConditional(
    actionRegistry: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement dynamic conditional execution
    return {
      success: true,
      result: { message: 'Conditional execution not yet implemented', config },
    };
  }

  /**
   * Fallback for legacy hardcoded actions
   */
  private async executeLegacyAction(
    actionKey: string,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    switch (actionKey) {
      case 'task_management':
        return this.executeTaskManagement(config, context);
      case 'send_email':
        return this.executeSendEmail(config, context);
      default:
        return {
          success: false,
          error: `Unknown legacy action: ${actionKey}`,
        };
    }
  }

  /**
   * Task Management Action - Now actually creates tasks in the database
   */
  private async executeTaskManagement(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const uuid = crypto.randomUUID();

    try {
      const {
        operation = 'create',
        title,
        description,
        dueDate,
        dueDateDynamic,
        status = TaskStatus.PENDING,
        entityType = TaskRelatedEntityType.CRM_LEAD,
        entityId,
        priority,
        additionalData,
      } = config;

      let finalDueDate: Date | undefined = dueDate;

      // Handle dynamic due dates like '+1d', '+2h', etc.
      if (dueDateDynamic && typeof dueDateDynamic === 'string') {
        finalDueDate = this.parseDynamicDate(dueDateDynamic);
      }

      if (operation === 'create') {
        const task = this.taskRepository.create({
          title,
          description,
          dueDate: finalDueDate,
          status,
          entityType,
          entityId: uuid,
        });

        const savedTask = await this.taskRepository.save(task);

        this.logger.log(`Task created successfully: ${savedTask.entityId}`);

        return {
          success: true,
          result: {
            task: {
              id: savedTask.entityId,
              title: savedTask.title,
              description: savedTask.description,
              status: savedTask.status,
              dueDate: savedTask.dueDate,
              entityType: savedTask.entityType,
              entityId: savedTask.entityId,
              createdAt: savedTask.createdAt,
            },
            operation: 'create',
            priority,
            additionalData,
          },
        };
      } else if (operation === 'update') {
        // TODO: Implement task update logic
        return {
          success: false,
          error: 'Task update operation not yet implemented',
        };
      } else if (operation === 'delete') {
        // TODO: Implement task delete logic
        return {
          success: false,
          error: 'Task delete operation not yet implemented',
        };
      } else {
        return {
          success: false,
          error: `Unknown task operation: ${operation}`,
        };
      }
    } catch (error) {
      this.logger.error('Task creation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task creation failed',
      };
    }
  }

  /**
   * Send Email Action (placeholder)
   */
  private async executeSendEmail(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement actual email sending
    return {
      success: true,
      result: { email: 'sent', config },
    };
  }

  /**
   * Send SMS Action (placeholder)
   */
  private async executeSendSms(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement actual SMS sending
    return {
      success: true,
      result: { sms: 'sent', config },
    };
  }

  /**
   * Process template variables in config
   * Replaces {{variable.something}} with actual values from context
   */
  private processConfigVariables(config: any, context: WorkflowContext): any {
    const configStr = JSON.stringify(config);
    let processedStr = configStr;

    // Replace variables from context
    if (context.variables) {
      processedStr = processedStr.replace(
        /\{\{variable\.([^}]+)\}\}/g,
        (match, path) => {
          const value = this.getNestedValue(context.variables, path);
          return value !== undefined ? String(value) : match;
        }
      );
    }

    // Replace trigger data variables
    if (context.triggerData) {
      processedStr = processedStr.replace(
        /\{\{trigger\.([^}]+)\}\}/g,
        (match, path) => {
          const value = this.getNestedValue(context.triggerData, path);
          return value !== undefined ? String(value) : match;
        }
      );
    }

    try {
      return JSON.parse(processedStr);
    } catch {
      // If JSON parsing fails, return original config
      return config;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Parse dynamic date strings like '+1d', '+2h', '+30m'
   */
  private parseDynamicDate(dynamicDate: string): Date {
    const now = new Date();
    const match = dynamicDate.match(/^([+-])(\d+)([dhm])$/);

    if (!match) {
      return now; // Fallback to current time if parsing fails
    }

    const [, sign, amount, unit] = match;
    const multiplier = sign === '+' ? 1 : -1;
    const value = parseInt(amount) * multiplier;

    const result = new Date(now);

    switch (unit) {
      case 'd': // days
        result.setDate(result.getDate() + value);
        break;
      case 'h': // hours
        result.setHours(result.getHours() + value);
        break;
      case 'm': // minutes
        result.setMinutes(result.getMinutes() + value);
        break;
    }

    return result;
  }
}
