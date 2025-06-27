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
} from '@internal-workflow/storage';
import { WorkflowFilterService } from './workflow-filter.service';
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
        where: { versionId: workflow.latestVersion.id },
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

      // Find workflows that use this trigger
      const workflows = await this.findWorkflowsByTrigger(triggerKey);

      for (const workflow of workflows) {
        // Check if trigger conditions are met
        const shouldExecute = await this.shouldExecuteWorkflow(
          workflow,
          trigger,
          eventData
        );

        if (shouldExecute) {
          const workflowContext: WorkflowContext = {
            triggerData: eventData,
            variables: { ...context.variables, trigger: eventData },
            workflowId: workflow.id,
            userId: context.userId,
            tenantId: context.tenantId,
          };

          // Execute workflow asynchronously
          this.executeWorkflow(workflow.id, workflowContext).catch((error) => {
            this.logger.error(
              `Async workflow execution failed: ${workflow.id}`,
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
   * Execute workflow steps in sequence
   */
  private async executeSteps(
    steps: WorkflowStepEntity[],
    run: WorkflowRunEntity,
    context: WorkflowContext
  ): Promise<{ success: boolean; results: any[] }> {
    const results: any[] = [];
    let success = true;

    for (const step of steps) {
      this.logger.log(`Executing step: ${step.name} (${step.kind})`);

      try {
        const stepRun = await this.createStepRun(step, run);
        const result = await this.executeStep(step, context);

        await this.updateStepRun(stepRun, result);
        results.push(result);

        if (!result.success) {
          success = false;
          this.logger.error(`Step failed: ${step.name}`, result.error);

          // Stop execution on step failure (you might want to make this configurable)
          break;
        }

        // Update context with step result
        if (result.result) {
          context.variables = {
            ...context.variables,
            [step.name]: result.result,
          };
        }
      } catch (error) {
        success = false;
        this.logger.error(`Step execution error: ${step.name}`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stepName: step.name,
        });
        break;
      }
    }

    return { success, results };
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
    const actionKey = step.actionKey;
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
    const condition = step.cfg?.condition;
    if (!condition) {
      return {
        success: false,
        error: 'Condition not specified for condition step',
      };
    }

    const result = await this.filterService.evaluateFilter(
      condition,
      context.variables || {}
    );

    return {
      success: true,
      result: result,
    };
  }

  /**
   * Execute a delay step
   */
  private async executeDelayStep(
    step: WorkflowStepEntity,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const delayMs = step.cfg?.delayMs || 1000;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      success: true,
      result: { delayed: delayMs },
    };
  }

  /**
   * Create a step run record
   */
  private async createStepRun(
    step: WorkflowStepEntity,
    run: WorkflowRunEntity
  ): Promise<StepRunEntity> {
    const stepRun = this.stepRunRepository.create({
      step_id: step.id,
      run_id: run.id,
      status: 'PENDING',
      started_at: new Date(),
    });

    return await this.stepRunRepository.save(stepRun);
  }

  /**
   * Update step run with execution result
   */
  private async updateStepRun(
    stepRun: StepRunEntity,
    result: ExecutionResult
  ): Promise<void> {
    stepRun.status = result.success ? 'SUCCESS' : 'FAILED';
    stepRun.ended_at = new Date();
    // Note: StepRunEntity doesn't have output field, you might need to add it or store differently

    await this.stepRunRepository.save(stepRun);
  }

  /**
   * Update workflow run status
   */
  private async updateRunStatus(
    runId: string,
    stepResults: { success: boolean; results: any[] }
  ): Promise<void> {
    const run = await this.runRepository.findOne({ where: { id: runId } });
    if (run) {
      run.status = stepResults.success ? 'SUCCESS' : 'FAILED';
      run.ended_at = new Date();

      if (!stepResults.success) {
        const failedStep = stepResults.results.find((r) => !r.success);
        run.fail_reason = failedStep?.error || 'Unknown error';
      }

      await this.runRepository.save(run);
    }
  }

  /**
   * Find workflows that use a specific trigger
   */
  private async findWorkflowsByTrigger(
    triggerKey: string
  ): Promise<WorkflowDefinitionEntity[]> {
    // This would need to be implemented based on how triggers are linked to workflows
    // For now, returning empty array - you'll need to implement the relationship
    return [];
  }

  /**
   * Check if workflow should execute based on trigger conditions
   */
  private async shouldExecuteWorkflow(
    workflow: WorkflowDefinitionEntity,
    trigger: WorkflowTriggerRegistryEntity,
    eventData: any
  ): Promise<boolean> {
    // Get workflow version and its trigger configuration
    const version = await this.versionRepository.findOne({
      where: { id: workflow.latestVersion!.id },
    });

    if (!version || !version.inline_json) {
      return false;
    }

    const workflowConfig = version.inline_json;

    // Apply trigger filters if they exist in the workflow configuration
    if (
      workflowConfig.triggerFilters &&
      workflowConfig.triggerFilters.length > 0
    ) {
      return await this.filterService.evaluateFilters(
        workflowConfig.triggerFilters,
        eventData
      );
    }

    return true;
  }

  /**
   * Resolve variables in configuration using context
   */
  private resolveVariables(config: any, context: WorkflowContext): any {
    if (!config || !context.variables) return config;

    const configStr = JSON.stringify(config);
    const resolvedStr = configStr.replace(
      /\{\{([\w.]+)\}\}/g,
      (match, variable) => {
        const value = this.getNestedProperty(context.variables!, variable);
        return value !== undefined ? value : match;
      }
    );

    try {
      return JSON.parse(resolvedStr);
    } catch {
      return config;
    }
  }

  /**
   * Get nested property from object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}
