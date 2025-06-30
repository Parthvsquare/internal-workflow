import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowRunEntity,
  WorkflowStepEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
  WorkflowVariableEntity,
} from '@internal-workflow/storage';
import {
  WorkflowContext,
  ExecutionResult,
} from '../interfaces/workflow.interfaces';
import { WorkflowFilterService } from './workflow-filter.service';
import { WorkflowActionExecutor } from './workflow-action.executor';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectRepository(WorkflowDefinitionEntity)
    private readonly workflowRepository: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowRunEntity)
    private readonly runRepository: Repository<WorkflowRunEntity>,
    @InjectRepository(WorkflowStepEntity)
    private readonly stepRepository: Repository<WorkflowStepEntity>,
    @InjectRepository(WorkflowTriggerRegistryEntity)
    private readonly triggerRegistry: Repository<WorkflowTriggerRegistryEntity>,
    @InjectRepository(WorkflowSubscriptionEntity)
    private readonly subscriptionRepository: Repository<WorkflowSubscriptionEntity>,
    @InjectRepository(WorkflowVariableEntity)
    private readonly workflowVariableRepository: Repository<WorkflowVariableEntity>,
    private readonly filterService: WorkflowFilterService,
    private readonly actionExecutor: WorkflowActionExecutor
  ) {}

  /**
   * Get all active trigger registries
   */
  async getActiveTriggerRegistries(): Promise<WorkflowTriggerRegistryEntity[]> {
    return this.triggerRegistry.find({
      where: { is_active: true },
    });
  }

  /**
   * Process trigger event to determine if workflows should be executed
   */
  async processTriggerEvent(
    triggerKey: string,
    eventData: any,
    context: Partial<WorkflowContext> & { trigger_event_id?: string } = {}
  ): Promise<{
    success: boolean;
    message: string;
    workflowsTriggered: number;
  }> {
    this.logger.log(`Processing trigger event: ${triggerKey}`);

    try {
      // Get trigger registry
      const trigger = await this.triggerRegistry.findOne({
        where: { key: triggerKey, is_active: true },
      });

      if (!trigger) {
        this.logger.warn(`Trigger not found: ${triggerKey}`);
        return {
          success: false,
          message: `Trigger ${triggerKey} not found`,
          workflowsTriggered: 0,
        };
      }

      // Find workflows subscribed to this trigger
      const workflowSubscriptions = await this.subscriptionRepository.find({
        where: { trigger_key: triggerKey, is_active: true },
        relations: ['workflow'],
      });

      this.logger.debug(
        `Found ${workflowSubscriptions.length} subscriptions for trigger: ${triggerKey}`
      );

      let workflowsTriggered = 0;

      for (const subscription of workflowSubscriptions) {
        if (!subscription.workflow) {
          continue;
        }

        // Check if trigger conditions are met
        const shouldExecute = await this.shouldExecuteWorkflow(
          subscription,
          eventData
        );

        if (shouldExecute) {
          const workflowContext: WorkflowContext = {
            triggerData: eventData,
            variables: { ...context.variables, trigger: eventData },
            workflowId: subscription.workflow.id,
            userId: context.userId,
            tenantId: context.tenantId,
            triggerEventId: context.trigger_event_id,
            triggerType: 'database',
            executionMode: context.executionMode || 'async',
          };

          // Execute workflow asynchronously
          this.executeWorkflow(
            subscription.workflow!.id,
            workflowContext
          ).catch((error) => {
            this.logger.error(
              `Async workflow execution failed: ${subscription.workflow!.id}`,
              error
            );
          });

          workflowsTriggered++;
        }
      }

      return {
        success: true,
        message: `Processed trigger ${triggerKey}`,
        workflowsTriggered,
      };
    } catch (error) {
      this.logger.error(`Trigger processing failed: ${triggerKey}`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        workflowsTriggered: 0,
      };
    }
  }

  /**
   * Execute a workflow with the given context
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.logger.log(`Starting workflow execution: ${workflowId}`);

    try {
      // Get workflow definition with latest version
      const workflow = await this.workflowRepository.findOne({
        where: { id: workflowId, is_active: true },
        relations: ['latestVersion'],
      });

      if (!workflow || !workflow.latestVersion) {
        return {
          success: false,
          error: `Workflow ${workflowId} not found or inactive`,
        };
      }

      // Load workflow variables and merge with context
      const workflowVariables = await this.loadWorkflowVariables(workflowId);
      context.variables = {
        ...workflowVariables,
        ...context.variables,
        trigger: context.triggerData,
      };

      // Create workflow run
      const run = await this.createWorkflowRun(workflow, context);
      context.runId = run.id;

      // Get workflow steps
      const steps = await this.stepRepository.find({
        where: { version_id: workflow.latestVersion.id },
        order: { name: 'ASC' },
      });

      // Execute steps
      const stepResults = await this.executeSteps(steps, context);

      const executionTime = Date.now() - startTime;
      this.logger.log(
        `Workflow execution completed: ${workflowId} in ${executionTime}ms`
      );

      return {
        success: stepResults.success,
        result: { runId: run.id, stepResults: stepResults.results },
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Workflow execution failed: ${workflowId}`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  private async shouldExecuteWorkflow(
    subscription: WorkflowSubscriptionEntity,
    eventData: any
  ): Promise<boolean> {
    if (!subscription.filter_conditions) {
      return true; // No filter conditions, always execute
    }

    try {
      return await this.filterService.evaluateFilter(
        subscription.filter_conditions,
        eventData
      );
    } catch (error) {
      this.logger.error(
        `Filter evaluation failed for subscription ${subscription.id}`,
        error
      );
      return false;
    }
  }

  private async loadWorkflowVariables(
    workflowId: string
  ): Promise<Record<string, any>> {
    const variables = await this.workflowVariableRepository.find({
      where: { workflow_id: workflowId },
    });

    const variableMap: Record<string, any> = {};
    for (const variable of variables) {
      variableMap[variable.key] = variable.value;
    }

    return variableMap;
  }

  private async createWorkflowRun(
    workflow: WorkflowDefinitionEntity,
    context: WorkflowContext
  ): Promise<WorkflowRunEntity> {
    const run = this.runRepository.create({
      workflow_id: workflow.id,
      version_id: workflow.latest_ver_id!,
      trigger_event_id: context.triggerEventId,
      trigger_type: context.triggerType,
      execution_mode: context.executionMode || 'async',
      status: 'PENDING',
      total_steps: 0,
      completed_steps: 0,
      failed_steps: 0,
      skipped_steps: 0,
      network_calls: 0,
      network_time: 0,
      cache_hits: 0,
      cache_misses: 0,
      error_count: 0,
      warning_count: 0,
      retry_count: 0,
      max_retries: 3,
      context_data: context.triggerData,
      created_by: context.userId,
    });

    return this.runRepository.save(run);
  }

  private async executeSteps(
    steps: WorkflowStepEntity[],
    context: WorkflowContext
  ): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];
    let allSuccessful = true;

    for (const step of steps) {
      try {
        const result = await this.executeStep(step, context);
        results.push(result);

        if (!result.success) {
          allSuccessful = false;
          // In a real implementation, you might want to stop here or continue based on step configuration
        }
      } catch (error) {
        this.logger.error(`Step execution failed: ${step.id}`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        allSuccessful = false;
      }
    }

    return { success: allSuccessful, results };
  }

  private async executeStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    switch (step.kind) {
      case 'action':
        return this.executeActionStep(step, context);
      case 'condition':
        return this.executeConditionStep(step, context);
      case 'delay':
        return this.executeDelayStep(step, context);
      default:
        return {
          success: false,
          error: `Unknown step kind: ${step.kind}`,
        };
    }
  }

  private async executeActionStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    if (!step.action_key) {
      return {
        success: false,
        error: 'Action step missing action_key',
      };
    }

    return this.actionExecutor.executeAction(
      step.action_key,
      step.cfg || {},
      context
    );
  }

  private async executeConditionStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // Implement condition logic
    return {
      success: true,
      result: { condition: true },
    };
  }

  private async executeDelayStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const delay = (step.cfg as any)?.delay || 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      success: true,
      result: { delayed: delay },
    };
  }
}
