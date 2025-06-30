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
  WorkflowVariableEntity,
  WebhookEndpointEntity,
  ScheduleTriggerEntity,
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
  triggerEventId?: string;
  triggerType?: 'webhook' | 'schedule' | 'manual' | 'database' | 'api';
  executionMode?: 'sync' | 'async' | 'test';
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  results?: any[];
  executionTime?: number;
  stepRunId?: string;
}

export interface StepExecutionContext {
  step: WorkflowStepEntity;
  context: WorkflowContext;
  runId: string;
  inputData?: any;
  retryCount?: number;
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
    @InjectRepository(WorkflowVariableEntity)
    private readonly workflowVariableRepository: Repository<WorkflowVariableEntity>,
    @InjectRepository(WebhookEndpointEntity)
    private readonly webhookEndpointRepository: Repository<WebhookEndpointEntity>,
    @InjectRepository(ScheduleTriggerEntity)
    private readonly scheduleTriggerRepository: Repository<ScheduleTriggerEntity>,
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

      // Create workflow run with enhanced tracking
      const run = await this.createWorkflowRun(workflow, context);
      context.runId = run.id;

      // Get workflow steps
      const steps = await this.stepRepository.find({
        where: { version_id: workflow.latestVersion.id },
        order: { name: 'ASC' },
      });

      // Update run with step count
      await this.runRepository.update(run.id, {
        total_steps: steps.length,
        status: 'RUNNING',
      });

      // Execute steps with enhanced tracking
      const stepResults = await this.executeSteps(steps, run, context);

      // Update run status with detailed metrics
      await this.updateRunStatus(run.id, stepResults, startTime);

      // Create execution metrics
      await this.createExecutionMetrics(run, stepResults, startTime);

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

      // Update run status to failed if we have a run ID
      if (context.runId) {
        await this.runRepository.update(context.runId, {
          status: 'FAILED',
          ended_at: new Date(),
          execution_time: executionTime,
          fail_reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  /**
   * Process trigger event to determine if workflows should be executed
   */
  async processTriggerEvent(
    triggerKey: string,
    eventData: any,
    context: Partial<WorkflowContext> & { trigger_event_id?: string } = {}
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

      // Determine trigger type from event source
      const triggerType = this.determineTriggerType(trigger, eventData);

      // Create trigger summary for quick access
      const triggerSummary = this.createTriggerSummary(eventData, triggerType);

      // Find workflows subscribed to this trigger
      const workflowSubscriptions =
        await this.findWorkflowSubscriptionsByTrigger(triggerKey);

      this.logger.debug(
        `Found ${workflowSubscriptions.length} subscriptions for trigger: ${triggerKey}`
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

        if (shouldExecute) {
          const workflowContext: WorkflowContext = {
            triggerData: eventData,
            variables: { ...context.variables, trigger: eventData },
            workflowId: subscription.workflow.id,
            userId: context.userId,
            tenantId: context.tenantId,
            triggerEventId: context.trigger_event_id,
            triggerType,
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
        }
      }
    } catch (error) {
      this.logger.error(`Trigger processing failed: ${triggerKey}`, error);
    }
  }

  /**
   * Create a new workflow run record with enhanced tracking
   */
  private async createWorkflowRun(
    workflow: WorkflowDefinitionEntity,
    context: WorkflowContext
  ): Promise<WorkflowRunEntity> {
    // Create trigger summary if we have trigger data
    const triggerSummary = context.triggerData
      ? this.createTriggerSummary(context.triggerData, context.triggerType)
      : undefined;

    const run = this.runRepository.create({
      workflow_id: workflow.id,
      version_id: workflow.latestVersion!.id,
      trigger_event_id:
        context.triggerEventId || context.triggerData?.eventId || 'manual',
      trigger_type: context.triggerType || 'manual',
      trigger_summary: triggerSummary,
      execution_mode: context.executionMode || 'async',
      status: 'PENDING',
      started_at: new Date(),
      created_by: context.userId,
      // Initialize counters
      total_steps: 0,
      completed_steps: 0,
      failed_steps: 0,
      skipped_steps: 0,
      retry_count: 0,
      max_retries: 3, // Default max retries
    });

    return await this.runRepository.save(run);
  }

  /**
   * Execute workflow steps with enhanced tracking
   */
  private async executeSteps(
    steps: WorkflowStepEntity[],
    run: WorkflowRunEntity,
    context: WorkflowContext
  ): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];
    let overallSuccess = true;
    let completedSteps = 0;
    let failedSteps = 0;
    const skippedSteps = 0;

    for (const step of steps) {
      try {
        // Create step run record
        const stepRun = await this.createStepRun(step, run.id, 'PENDING');

        const stepResult = await this.executeStepWithTracking({
          step,
          context,
          runId: run.id,
          retryCount: 0,
        });

        // Update step run record
        await this.updateStepRun(stepRun, stepResult);

        results.push({
          ...stepResult,
          stepRunId: stepRun.run_id + '_' + stepRun.step_id,
        });

        if (stepResult.success) {
          completedSteps++;
        } else {
          failedSteps++;
          overallSuccess = false;
          break;
        }
      } catch (error) {
        failedSteps++;
        overallSuccess = false;

        const errorResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0,
        };

        results.push(errorResult);
        break;
      }
    }

    // Update workflow run counters
    await this.runRepository.update(run.id, {
      completed_steps: completedSteps,
      failed_steps: failedSteps,
      skipped_steps: skippedSteps,
    });

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
    stepResults: { success: boolean; results: any[] },
    startTime: number
  ): Promise<void> {
    const status = stepResults.success ? 'SUCCESS' : 'FAILED';
    const failReason = stepResults.success
      ? undefined
      : 'One or more steps failed';

    const executionTime = Date.now() - startTime;

    await this.runRepository.update(runId, {
      status,
      ended_at: new Date(),
      fail_reason: failReason,
      execution_time: executionTime,
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

  /**
   * Load workflow-specific variables
   */
  private async loadWorkflowVariables(
    workflowId: string
  ): Promise<Record<string, any>> {
    const variables = await this.workflowVariableRepository.find({
      where: { workflow_id: workflowId },
    });

    const variableMap: Record<string, any> = {};
    for (const variable of variables) {
      // Use default value if current value is null/undefined
      variableMap[variable.key] = variable.value ?? variable.default_value;
    }

    return variableMap;
  }

  /**
   * Create a step run record for tracking
   */
  private async createStepRun(
    step: WorkflowStepEntity,
    runId: string,
    status: string,
    inputData?: any
  ): Promise<StepRunEntity> {
    const stepRun = this.stepRunRepository.create({
      run_id: runId,
      step_id: step.id,
      status,
      started_at: new Date(),
      input_data: inputData,
      retry_count: 0,
      max_retries: 3, // Default max retries per step
    });

    return await this.stepRunRepository.save(stepRun);
  }

  /**
   * Execute a step with enhanced tracking
   */
  private async executeStepWithTracking(
    stepContext: StepExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const result = await this.executeStep(
        stepContext.step,
        stepContext.context
      );
      const executionTime = Date.now() - startTime;

      return {
        ...result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  /**
   * Update step run record with execution results
   */
  private async updateStepRun(
    stepRun: StepRunEntity,
    result: ExecutionResult
  ): Promise<void> {
    const updateData: Partial<StepRunEntity> = {
      status: result.success ? 'SUCCESS' : 'FAILED',
      ended_at: new Date(),
      execution_time: result.executionTime || 0,
      result_data: result.result,
      output_data: result.result,
    };

    if (!result.success && result.error) {
      updateData.error_message = result.error;
      // Could add error stack if available
    }

    await this.stepRunRepository.update(
      { run_id: stepRun.run_id, step_id: stepRun.step_id },
      updateData
    );
  }

  /**
   * Update workflow run with detailed execution metrics
   */
  private async createExecutionMetrics(
    run: WorkflowRunEntity,
    stepResults: { success: boolean; results: any[] },
    startTime: number
  ): Promise<void> {
    try {
      const executionTime = Date.now() - startTime;

      // Count errors and network calls from step results
      let errorCount = 0;
      let networkCalls = 0;
      let networkTime = 0;
      let cacheHits = 0;
      let cacheMisses = 0;
      let warningCount = 0;

      stepResults.results.forEach((result) => {
        if (result.error) errorCount++;
        if (result.networkCalls) networkCalls += result.networkCalls;
        if (result.networkTime) networkTime += result.networkTime;
        if (result.cacheHits) cacheHits += result.cacheHits;
        if (result.cacheMisses) cacheMisses += result.cacheMisses;
        if (result.warnings) warningCount += result.warnings;
      });

      // Update the workflow run with consolidated metrics
      await this.runRepository.update(run.id, {
        network_calls: networkCalls,
        network_time: networkTime,
        cache_hits: cacheHits,
        cache_misses: cacheMisses,
        error_count: errorCount,
        warning_count: warningCount,
        // Note: success_rate and cache_hit_rate are computed properties
      });
    } catch (error) {
      this.logger.error('Failed to update execution metrics:', error);
      // Don't fail the workflow if metrics update fails
    }
  }

  private determineTriggerType(
    trigger: WorkflowTriggerRegistryEntity,
    eventData: any
  ): WorkflowContext['triggerType'] {
    // Determine trigger type based on trigger's event_source
    if (trigger.event_source === 'webhook') return 'webhook';
    if (trigger.event_source === 'schedule') return 'schedule';
    if (trigger.event_source === 'debezium') return 'database';
    if (eventData?.manual) return 'manual';
    return 'api';
  }

  private createTriggerSummary(
    eventData: any,
    triggerType: WorkflowContext['triggerType']
  ): Record<string, any> {
    // Create a summary object for quick access and UI display
    const summary: Record<string, any> = {
      type: triggerType,
      timestamp: new Date().toISOString(),
    };

    switch (triggerType) {
      case 'database':
        summary.table = eventData?.table;
        summary.operation = eventData?.operation;
        summary.recordId = eventData?.after?.id || eventData?.before?.id;
        break;
      case 'webhook':
        summary.method = eventData?.method || 'POST';
        summary.path = eventData?.path;
        summary.source = eventData?.headers?.['user-agent'] || 'unknown';
        break;
      case 'schedule':
        summary.scheduleName = eventData?.scheduleName;
        summary.cronExpression = eventData?.cronExpression;
        break;
      case 'manual':
        summary.userId = eventData?.userId;
        summary.reason = eventData?.reason || 'Manual trigger';
        break;
      default:
        summary.source = 'api';
    }

    return summary;
  }
}
