import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowActionRegistryEntity,
  TaskEntity,
  TaskStatus,
  TaskRelatedEntityType,
} from '@internal-workflow/storage';
import { WorkflowContext, ExecutionResult } from './workflow-engine.service';

@Injectable()
export class WorkflowActionExecutor {
  private readonly logger = new Logger(WorkflowActionExecutor.name);

  constructor(
    @InjectRepository(WorkflowActionRegistryEntity)
    private readonly actionRegistry: Repository<WorkflowActionRegistryEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>
  ) {}

  /**
   * Execute an action based on its registry key - completely dynamic
   */
  async executeAction(
    actionKey: string,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Executing action: ${actionKey}`);

    try {
      // Get action registry details
      const action = await this.actionRegistry.findOne({
        where: { key: actionKey, is_active: true },
      });

      if (!action) {
        return {
          success: false,
          error: `Action not found: ${actionKey}`,
        };
      }

      // Execute based on execution type from registry
      switch (action.execution_type) {
        case 'internal_function':
          return await this.executeInternalFunction(action, config, context);

        case 'external_api':
          return await this.executeExternalApi(action, config, context);

        case 'conditional':
          return await this.executeConditional(action, config, context);

        default:
          return await this.executeGenericAction(action, config, context);
      }
    } catch (error) {
      this.logger.error(`Action execution failed: ${actionKey}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute internal function based on action category/name
   */
  private async executeInternalFunction(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Executing internal function: ${action.name}`);

    // Route to appropriate internal function based on action name/category
    if (action.name === 'taskManagement' || action.category === 'task') {
      return await this.executeTaskManagement(action, config, context);
    }

    if (action.category === 'communication') {
      return await this.executeCommunicationAction(action, config, context);
    }

    if (action.category === 'database') {
      return await this.executeDatabaseAction(action, config, context);
    }

    // Default internal function execution
    return {
      success: true,
      result: {
        action: action.name,
        category: action.category,
        executed: true,
        config,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute task management operations dynamically
   */
  private async executeTaskManagement(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const operation = config.operation || 'create';

    try {
      switch (operation) {
        case 'create':
          return await this.createTask(config, context);
        case 'update':
          return await this.updateTask(config, context);
        case 'delete':
          return await this.deleteTask(config, context);
        case 'get':
          return await this.getTask(config, context);
        case 'list':
          return await this.listTasks(config, context);
        default:
          return {
            success: false,
            error: `Unknown task operation: ${operation}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task operation failed',
      };
    }
  }

  /**
   * Create task from trigger data
   */
  private async createTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // Extract task data from config and context
    const taskData = {
      title: config.title || this.extractFromContext('title', context),
      description:
        config.description || this.extractFromContext('description', context),
      dueDate: config.dueDate ? new Date(config.dueDate) : undefined,
      status: (config.status as TaskStatus) || TaskStatus.PENDING,
      entityType:
        (config.entityType as TaskRelatedEntityType) ||
        TaskRelatedEntityType.CRM_LEAD,
      cronExpression: config.cronExpression,
    };

    // Validate required fields
    if (!taskData.title) {
      return {
        success: false,
        error: 'Task title is required',
      };
    }

    const task = this.taskRepository.create(taskData);
    const savedTask = await this.taskRepository.save(task);

    this.logger.log(`Task created: ${savedTask.entityId}`);

    return {
      success: true,
      result: {
        entityId: savedTask.entityId,
        title: savedTask.title,
        status: savedTask.status,
        createdAt: savedTask.createdAt,
      },
    };
  }

  /**
   * Update existing task
   */
  private async updateTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    if (!config.taskId) {
      return {
        success: false,
        error: 'Task ID is required for update operation',
      };
    }

    const task = await this.taskRepository.findOne({
      where: { entityId: config.taskId },
    });

    if (!task) {
      return {
        success: false,
        error: `Task not found: ${config.taskId}`,
      };
    }

    // Update fields if provided
    if (config.title) task.title = config.title;
    if (config.description) task.description = config.description;
    if (config.dueDate) task.dueDate = new Date(config.dueDate);
    if (config.status) task.status = config.status;

    const updatedTask = await this.taskRepository.save(task);

    return {
      success: true,
      result: {
        entityId: updatedTask.entityId,
        title: updatedTask.title,
        status: updatedTask.status,
        updatedAt: updatedTask.updatedAt,
      },
    };
  }

  /**
   * Delete task
   */
  private async deleteTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    if (!config.taskId) {
      return {
        success: false,
        error: 'Task ID is required for delete operation',
      };
    }

    const result = await this.taskRepository.delete({
      entityId: config.taskId,
    });

    if (result.affected === 0) {
      return {
        success: false,
        error: `Task not found: ${config.taskId}`,
      };
    }

    return {
      success: true,
      result: {
        deleted: true,
        taskId: config.taskId,
      },
    };
  }

  /**
   * Get single task
   */
  private async getTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    if (!config.taskId) {
      return {
        success: false,
        error: 'Task ID is required for get operation',
      };
    }

    const task = await this.taskRepository.findOne({
      where: { entityId: config.taskId },
    });

    if (!task) {
      return {
        success: false,
        error: `Task not found: ${config.taskId}`,
      };
    }

    return {
      success: true,
      result: task,
    };
  }

  /**
   * List tasks with filters
   */
  private async listTasks(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const filters = config.filters || {};
    const limit = config.limit || 50;
    const offset = config.offset || 0;

    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    // Apply filters dynamically
    if (filters.status) {
      queryBuilder.andWhere('task.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    if (filters.entityType) {
      queryBuilder.andWhere('task.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters.dueDateFrom) {
      queryBuilder.andWhere('task.dueDate >= :dueDateFrom', {
        dueDateFrom: filters.dueDateFrom,
      });
    }

    if (filters.dueDateTo) {
      queryBuilder.andWhere('task.dueDate <= :dueDateTo', {
        dueDateTo: filters.dueDateTo,
      });
    }

    const tasks = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return {
      success: true,
      result: {
        tasks,
        count: tasks.length,
        limit,
        offset,
      },
    };
  }

  /**
   * Execute communication actions (email, SMS, etc.)
   */
  private async executeCommunicationAction(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Communication action: ${action.name}`, { config });

    // TODO: Implement actual communication services
    return {
      success: true,
      result: {
        action: action.name,
        type: 'communication',
        recipient: config.to || config.phoneNumber,
        message: config.message || config.body,
        sent: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute database actions
   */
  private async executeDatabaseAction(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Database action: ${action.name}`, { config });

    // TODO: Implement database operations
    return {
      success: true,
      result: {
        action: action.name,
        type: 'database',
        executed: true,
        config,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute external API calls
   */
  private async executeExternalApi(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`External API action: ${action.name}`, { config });

    // TODO: Implement external API calls with authentication
    return {
      success: true,
      result: {
        action: action.name,
        type: 'external_api',
        executed: true,
        config,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute conditional logic
   */
  private async executeConditional(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Conditional action: ${action.name}`, { config });

    // TODO: Implement conditional logic
    return {
      success: true,
      result: {
        action: action.name,
        type: 'conditional',
        conditionMet: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute generic action (fallback)
   */
  private async executeGenericAction(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Generic action executed: ${action.name}`, { config });

    return {
      success: true,
      result: {
        action: action.name,
        category: action.category,
        executionType: action.execution_type,
        executed: true,
        config,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract data from trigger context
   */
  private extractFromContext(field: string, context: WorkflowContext): any {
    // Try to extract from trigger data
    if (context.triggerData) {
      // For database changes, look in 'after' data first, then 'before'
      if (context.triggerData.after && context.triggerData.after[field]) {
        return context.triggerData.after[field];
      }
      if (context.triggerData.before && context.triggerData.before[field]) {
        return context.triggerData.before[field];
      }
      // For other trigger types, look in data
      if (context.triggerData.data && context.triggerData.data[field]) {
        return context.triggerData.data[field];
      }
      // Direct field access
      if (context.triggerData[field]) {
        return context.triggerData[field];
      }
    }

    // Try to extract from variables
    if (context.variables && context.variables[field]) {
      return context.variables[field];
    }

    return undefined;
  }
}
