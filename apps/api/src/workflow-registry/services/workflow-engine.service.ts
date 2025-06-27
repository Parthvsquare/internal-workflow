import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowRunEntity,
  StepRunEntity,
  WorkflowStepEntity,
  WorkflowVersionEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
} from '@internal-workflow/storage';
import {
  FilterCondition,
  WorkflowFilterService,
} from './workflow-filter.service';
import { WorkflowActionExecutor } from './workflow-action.executor';

export interface WorkflowContext {
  triggerData: any;
  variables?: Record<string, any>;
  workflowId?: string;
  runId?: string;
  userId?: string;
  tenantId?: string;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  results?: any[];
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectRepository(WorkflowDefinitionEntity)
    private readonly workflowRepository: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowRunEntity)
    private readonly runRepository: Repository<WorkflowRunEntity>,
    @InjectRepository(StepRunEntity)
    private readonly stepRunRepository: Repository<StepRunEntity>,
    @InjectRepository(WorkflowStepEntity)
    private readonly stepRepository: Repository<WorkflowStepEntity>,
    @InjectRepository(WorkflowVersionEntity)
    private readonly versionRepository: Repository<WorkflowVersionEntity>,
    @InjectRepository(WorkflowActionRegistryEntity)
    private readonly actionRegistry: Repository<WorkflowActionRegistryEntity>,
    @InjectRepository(WorkflowTriggerRegistryEntity)
    private readonly triggerRegistry: Repository<WorkflowTriggerRegistryEntity>,
    @InjectRepository(WorkflowSubscriptionEntity)
    private readonly subscriptionRepository: Repository<WorkflowSubscriptionEntity>,
    private readonly filterService: WorkflowFilterService,
    private readonly actionExecutor: WorkflowActionExecutor
  ) {}

  /**
   * Execute a workflow with the given context
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
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

      // Create workflow run
      const run = await this.createWorkflowRun(workflow, context);

      // Get workflow steps
      const steps = await this.stepRepository.find({
        where: { version_id: workflow.latestVersion.id },
        order: { name: 'ASC' },
      });

      // Execute steps
      const stepResults = await this.executeSteps(steps, run, context);

      // Update run status
      await this.updateRunStatus(run.id, stepResults);

      this.logger.log(`Workflow execution completed: ${workflowId}`);

      return {
        success: stepResults.success,
        result: { runId: run.id, stepResults: stepResults.results },
      };
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${workflowId}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process trigger event to determine if workflows should be executed
   */
  async processTriggerEvent(
    triggerKey: string,
    eventData: any,
    context: Partial<WorkflowContext> = {}
  ): Promise<void> {
    this.logger.log(`Processing trigger event: ${triggerKey}`);

    try {
      // Get trigger registry
      const trigger = await this.triggerRegistry.findOne({
        where: { key: triggerKey, is_active: true },
      });

      if (!trigger) {
        this.logger.warn(`Trigger not found: ${triggerKey}`);
        return;
      }

      // Find workflows subscribed to this trigger
      const workflowSubscriptions =
        await this.findWorkflowSubscriptionsByTrigger(triggerKey);

      console.log(
        '===> ~ WorkflowEngineService ~ workflowSubscriptions:',
        workflowSubscriptions
      );

      for (const subscription of workflowSubscriptions) {
        if (!subscription.workflow) {
          continue;
        }

        // Check if trigger conditions are met
        const shouldExecute = await this.shouldExecuteWorkflow(
          subscription,
          eventData
        );

        console.log(
          '===> ~ WorkflowEngineService ~ shouldExecute:',
          shouldExecute
        );

        if (shouldExecute) {
          const workflowContext: WorkflowContext = {
            triggerData: eventData,
            variables: { ...context.variables, trigger: eventData },
            workflowId: subscription.workflow.id,
            userId: context.userId,
            tenantId: context.tenantId,
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
        }
      }
    } catch (error) {
      this.logger.error(`Trigger processing failed: ${triggerKey}`, error);
    }
  }

  /**
   * Create a new workflow run record
   */
  private async createWorkflowRun(
    workflow: WorkflowDefinitionEntity,
    context: WorkflowContext
  ): Promise<WorkflowRunEntity> {
    const run = this.runRepository.create({
      workflow_id: workflow.id,
      version_id: workflow.latestVersion!.id,
      trigger_event_id: context.triggerData?.eventId || 'manual',
      status: 'PENDING',
      started_at: new Date(),
    });

    return await this.runRepository.save(run);
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(
    steps: WorkflowStepEntity[],
    run: WorkflowRunEntity,
    context: WorkflowContext
  ): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];
    let overallSuccess = true;

    for (const step of steps) {
      try {
        const stepResult = await this.executeStep(step, context);
        results.push(stepResult);

        if (!stepResult.success) {
          overallSuccess = false;
          break;
        }
      } catch (error) {
        overallSuccess = false;
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        break;
      }
    }

    return { success: overallSuccess, results };
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    switch (step.kind) {
      case 'ACTION':
        return await this.executeActionStep(step, context);
      case 'CONDITION':
        return await this.executeConditionStep(step, context);
      case 'DELAY':
        return await this.executeDelayStep(step, context);
      default:
        return {
          success: false,
          error: `Unknown step kind: ${step.kind}`,
        };
    }
  }

  /**
   * Execute an action step
   */
  private async executeActionStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const actionKey = step.action_key;
    if (!actionKey) {
      return {
        success: false,
        error: 'Action key not specified for action step',
      };
    }

    const action = await this.actionRegistry.findOne({
      where: { key: actionKey, is_active: true },
    });

    if (!action) {
      return {
        success: false,
        error: `Action not found: ${actionKey}`,
      };
    }

    // Resolve variables in step configuration
    const resolvedConfig = this.resolveVariables(step.cfg, context);

    return await this.actionExecutor.executeAction(
      actionKey,
      resolvedConfig,
      context
    );
  }

  /**
   * Execute a condition step
   */
  private async executeConditionStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement condition logic
    return { success: true, result: { conditionMet: true } };
  }

  /**
   * Execute a delay step
   */
  private async executeDelayStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    // TODO: Implement delay logic
    return { success: true, result: { delayed: true } };
  }

  /**
   * Resolve variables in configuration
   */
  private resolveVariables(config: any, context: WorkflowContext): any {
    if (!config) return config;

    const configStr = JSON.stringify(config);
    const resolvedStr = configStr.replace(
      /\{\{([^}]+)\}\}/g,
      (match, variablePath) => {
        const value = this.getValueFromPath(
          context.variables || {},
          variablePath.trim()
        );
        return value !== undefined ? JSON.stringify(value) : match;
      }
    );

    try {
      return JSON.parse(resolvedStr);
    } catch {
      return config;
    }
  }

  /**
   * Get value from object path
   */
  private getValueFromPath(obj: any, path: string): any {
    return path
      .split('.')
      .reduce((current, key) => current && current[key], obj);
  }

  /**
   * Update workflow run status
   */
  private async updateRunStatus(
    runId: string,
    stepResults: { success: boolean; results: any[] }
  ): Promise<void> {
    const status = stepResults.success ? 'SUCCESS' : 'FAILED';
    const failReason = stepResults.success
      ? undefined
      : 'One or more steps failed';

    await this.runRepository.update(runId, {
      status,
      ended_at: new Date(),
      fail_reason: failReason,
    });
  }

  /**
   * Find workflow subscriptions by trigger key
   */
  private async findWorkflowSubscriptionsByTrigger(
    triggerKey: string
  ): Promise<WorkflowSubscriptionEntity[]> {
    return await this.subscriptionRepository.find({
      where: {
        trigger_key: triggerKey,
        is_active: true,
      },
      relations: ['workflow', 'triggerRegistry'],
    });
  }

  /**
   * Check if workflow should execute based on subscription filter conditions
   */
  private async shouldExecuteWorkflow(
    subscription: WorkflowSubscriptionEntity,
    eventData: any
  ): Promise<boolean> {
    // Check if workflow is active
    if (!subscription.workflow?.is_active) {
      return false;
    }

    // Apply subscription filter conditions if they exist
    if (
      subscription.filter_conditions &&
      Object.keys(subscription.filter_conditions).length > 0
    ) {
      // For now, return true - the filter service would need to be updated to handle this format
      this.logger.debug('Filter conditions found, but not implemented yet');
      return true;
    }

    return true;
  }
}
