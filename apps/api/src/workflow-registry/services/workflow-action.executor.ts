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
   * Execute an action based on its registry key
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

      // Execute based on action type
      switch (action.name) {
        case 'taskManagement':
          return await this.executeTaskManagementAction(config, context);

        case 'sendEmail':
          return await this.executeSendEmailAction(config, context);

        case 'sendSms':
          return await this.executeSendSmsAction(config, context);

        case 'slackNotification':
          return await this.executeSlackNotificationAction(config, context);

        case 'googleDriveUpload':
          return await this.executeGoogleDriveUploadAction(config, context);

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
   * Execute task management actions (create, update, delete, get, list)
   */
  private async executeTaskManagementAction(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const operation = config.operation;

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
  }

  /**
   * Create a new task
   */
  private async createTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    try {
      const task = this.taskRepository.create({
        title: config.title,
        description: config.description,
        dueDate: config.dueDate ? new Date(config.dueDate) : undefined,
        status: config.status || TaskStatus.PENDING,
        entityType: config.entityType || TaskRelatedEntityType.CRM_LEAD,
        cronExpression: config.cronExpression,
      });

      const savedTask = await this.taskRepository.save(task);

      this.logger.log(`Task created: ${savedTask.entityId}`);

      return {
        success: true,
        result: {
          taskId: savedTask.entityId,
          title: savedTask.title,
          status: savedTask.status,
          createdAt: savedTask.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create task: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Update an existing task
   */
  private async updateTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    try {
      const taskId = config.taskId;
      if (!taskId) {
        return {
          success: false,
          error: 'Task ID is required for update operation',
        };
      }

      const task = await this.taskRepository.findOne({
        where: { entityId: taskId },
      });

      if (!task) {
        return {
          success: false,
          error: `Task not found: ${taskId}`,
        };
      }

      // Update task fields
      if (config.title !== undefined) task.title = config.title;
      if (config.description !== undefined)
        task.description = config.description;
      if (config.dueDate !== undefined)
        task.dueDate = config.dueDate ? new Date(config.dueDate) : undefined;
      if (config.status !== undefined) task.status = config.status;
      if (config.entityType !== undefined) task.entityType = config.entityType;
      if (config.cronExpression !== undefined)
        task.cronExpression = config.cronExpression;

      const updatedTask = await this.taskRepository.save(task);

      this.logger.log(`Task updated: ${updatedTask.entityId}`);

      return {
        success: true,
        result: {
          taskId: updatedTask.entityId,
          title: updatedTask.title,
          status: updatedTask.status,
          updatedAt: updatedTask.updatedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update task: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Delete a task
   */
  private async deleteTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    try {
      const taskId = config.taskId;
      if (!taskId) {
        return {
          success: false,
          error: 'Task ID is required for delete operation',
        };
      }

      const result = await this.taskRepository.delete({ entityId: taskId });

      if (result.affected === 0) {
        return {
          success: false,
          error: `Task not found: ${taskId}`,
        };
      }

      this.logger.log(`Task deleted: ${taskId}`);

      return {
        success: true,
        result: { taskId, deleted: true },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete task: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Get a specific task
   */
  private async getTask(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    try {
      const taskId = config.taskId;
      if (!taskId) {
        return {
          success: false,
          error: 'Task ID is required for get operation',
        };
      }

      const task = await this.taskRepository.findOne({
        where: { entityId: taskId },
      });

      if (!task) {
        return {
          success: false,
          error: `Task not found: ${taskId}`,
        };
      }

      return {
        success: true,
        result: {
          taskId: task.entityId,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          entityType: task.entityType,
          cronExpression: task.cronExpression,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get task: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * List tasks with optional filters
   */
  private async listTasks(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    try {
      const filters = config.filters || {};
      const limit = config.limit || 50;
      const offset = config.offset || 0;

      const queryBuilder = this.taskRepository.createQueryBuilder('task');

      // Apply filters
      if (filters.status && Array.isArray(filters.status)) {
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
          dueDateFrom: new Date(filters.dueDateFrom),
        });
      }

      if (filters.dueDateTo) {
        queryBuilder.andWhere('task.dueDate <= :dueDateTo', {
          dueDateTo: new Date(filters.dueDateTo),
        });
      }

      // Apply pagination
      queryBuilder.limit(limit).offset(offset);

      // Order by creation date
      queryBuilder.orderBy('task.createdAt', 'DESC');

      const [tasks, total] = await queryBuilder.getManyAndCount();

      return {
        success: true,
        result: {
          tasks: tasks.map((task) => ({
            taskId: task.entityId,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
            entityType: task.entityType,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          })),
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list tasks: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Execute email sending action (placeholder implementation)
   */
  private async executeSendEmailAction(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement actual email sending logic
    this.logger.log(`Send email action executed (placeholder)`, {
      to: config.to,
      subject: config.subject,
      body: config.body,
    });

    return {
      success: true,
      result: {
        action: 'send_email',
        to: config.to,
        subject: config.subject,
        status: 'sent',
        messageId: `msg_${Date.now()}`,
      },
    };
  }

  /**
   * Execute SMS sending action (placeholder implementation)
   */
  private async executeSendSmsAction(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement actual SMS sending logic
    this.logger.log(`Send SMS action executed (placeholder)`, {
      to: config.to,
      message: config.message,
    });

    return {
      success: true,
      result: {
        action: 'send_sms',
        to: config.to,
        message: config.message,
        status: 'sent',
        messageId: `sms_${Date.now()}`,
      },
    };
  }

  /**
   * Execute Slack notification action (placeholder implementation)
   */
  private async executeSlackNotificationAction(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement actual Slack API integration
    this.logger.log(`Slack notification action executed (placeholder)`, {
      channel: config.channel,
      message: config.message,
    });

    return {
      success: true,
      result: {
        action: 'slack_notification',
        channel: config.channel,
        message: config.message,
        status: 'sent',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute Google Drive upload action (placeholder implementation)
   */
  private async executeGoogleDriveUploadAction(
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement actual Google Drive API integration
    this.logger.log(`Google Drive upload action executed (placeholder)`, {
      fileName: config.fileName,
      folderId: config.folderId,
    });

    return {
      success: true,
      result: {
        action: 'google_drive_upload',
        fileName: config.fileName,
        folderId: config.folderId,
        fileId: `file_${Date.now()}`,
        status: 'uploaded',
      },
    };
  }

  /**
   * Execute generic action (for custom actions)
   */
  private async executeGenericAction(
    action: WorkflowActionRegistryEntity,
    config: any,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    this.logger.log(`Generic action executed: ${action.name}`, { config });

    // TODO: Implement generic action execution based on action schema
    return {
      success: true,
      result: {
        action: action.name,
        executed: true,
        config,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
