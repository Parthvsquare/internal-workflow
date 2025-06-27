import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowVersionEntity,
  WorkflowStepEntity,
  WorkflowTriggerEntity,
  WorkflowEdgeEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
} from '@internal-workflow/storage';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowResponseDto,
  WorkflowExecutionDto,
  WorkflowStepDto,
  WorkflowEdgeDto,
} from './dto/workflow.dto';

@Injectable()
export class WorkflowGenerationService {
  private readonly logger = new Logger(WorkflowGenerationService.name);

  constructor(
    @InjectRepository(WorkflowDefinitionEntity)
    private readonly workflowRepository: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowVersionEntity)
    private readonly versionRepository: Repository<WorkflowVersionEntity>,
    @InjectRepository(WorkflowStepEntity)
    private readonly stepRepository: Repository<WorkflowStepEntity>,
    @InjectRepository(WorkflowTriggerEntity)
    private readonly triggerRepository: Repository<WorkflowTriggerEntity>,
    @InjectRepository(WorkflowEdgeEntity)
    private readonly edgeRepository: Repository<WorkflowEdgeEntity>,
    @InjectRepository(WorkflowActionRegistryEntity)
    private readonly actionRegistryRepository: Repository<WorkflowActionRegistryEntity>,
    @InjectRepository(WorkflowTriggerRegistryEntity)
    private readonly triggerRegistryRepository: Repository<WorkflowTriggerRegistryEntity>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Create a new workflow with steps and connections
   */
  async createWorkflow(dto: CreateWorkflowDto): Promise<WorkflowResponseDto> {
    this.logger.log(`Creating workflow: ${dto.name}`);

    // Validate trigger and actions exist in registry
    await this.validateWorkflowComponents(dto);

    return this.dataSource.transaction(async (manager) => {
      // 1. Create workflow definition
      const definition = manager.create(WorkflowDefinitionEntity, {
        name: dto.name,
        segment: dto.segment,
        is_active: dto.isActive ?? true,
        created_by: dto.createdBy,
      });
      const savedDefinition = await manager.save(definition);

      // 2. Create workflow version
      const version = manager.create(WorkflowVersionEntity, {
        workflow_id: savedDefinition.id,
        version_num: 1,
        s3_key: `s3://workflows/${savedDefinition.id}/v1.json`,
        inline_json: this.buildWorkflowJson(dto),
        editor_id: dto.createdBy,
      });
      const savedVersion = await manager.save(version);

      // 3. Create workflow trigger
      const trigger = manager.create(WorkflowTriggerEntity, {
        version_id: savedVersion.id,
        trigger_key: dto.trigger.triggerKey,
        filters: dto.trigger.filters,
      });
      await manager.save(trigger);

      // 4. Create workflow steps
      const stepMap = new Map<string, string>(); // name -> id mapping
      let rootStepId: string | null = null;

      for (const stepDto of dto.steps) {
        const step = manager.create(WorkflowStepEntity, {
          version_id: savedVersion.id,
          kind: stepDto.kind,
          action_key: stepDto.actionKey,
          cfg: stepDto.configuration.parameters,
          name: stepDto.name,
          resource: stepDto.configuration.resource,
          operation: stepDto.configuration.operation,
          credential_id: stepDto.configuration.credentialId,
        });
        const savedStep = await manager.save(step);
        stepMap.set(stepDto.name, savedStep.id);

        // First step becomes root step
        if (!rootStepId) {
          rootStepId = savedStep.id;
        }
      }

      // 5. Create workflow edges
      for (const edgeDto of dto.edges) {
        const fromStepId = stepMap.get(edgeDto.fromStep);
        const toStepId = stepMap.get(edgeDto.toStep);

        if (!fromStepId || !toStepId) {
          throw new BadRequestException(
            `Invalid edge: ${edgeDto.fromStep} -> ${edgeDto.toStep}. Step not found.`
          );
        }

        const edge = manager.create(WorkflowEdgeEntity, {
          from_step_id: fromStepId,
          to_step_id: toStepId,
          branch_key: edgeDto.branchKey || 'default',
        });
        await manager.save(edge);
      }

      // 6. Update version with root step
      if (rootStepId) {
        savedVersion.root_step_id = rootStepId;
        await manager.save(savedVersion);
      }

      // 7. Update definition with latest version
      savedDefinition.latestVersion = savedVersion;
      await manager.save(savedDefinition);

      this.logger.log(`Workflow created successfully: ${savedDefinition.id}`);

      return this.mapToResponseDto(savedDefinition, savedVersion, dto);
    });
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['latestVersion'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    // Get trigger, steps, and edges
    const [trigger, steps, edges] = await Promise.all([
      this.triggerRepository.findOne({
        where: { version_id: workflow.latestVersion!.id },
      }),
      this.stepRepository.find({
        where: { version_id: workflow.latestVersion!.id },
      }),
      this.edgeRepository.find({
        where: { from_step_id: workflow.latestVersion!.root_step_id! },
      }),
    ]);

    return this.mapToResponseDto(workflow, workflow.latestVersion!, {
      trigger,
      steps,
      edges,
    });
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    id: string,
    dto: UpdateWorkflowDto
  ): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { id },
      relations: ['latestVersion'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    // Validate components if provided
    if (dto.trigger || dto.steps) {
      await this.validateWorkflowComponents(dto as any);
    }

    return this.dataSource.transaction(async (manager) => {
      // Update definition
      if (dto.name || dto.segment !== undefined || dto.isActive !== undefined) {
        Object.assign(workflow, {
          ...(dto.name && { name: dto.name }),
          ...(dto.segment && { segment: dto.segment }),
          ...(dto.isActive !== undefined && { is_active: dto.isActive }),
        });
        await manager.save(workflow);
      }

      let latestVersion = workflow.latestVersion!;

      // If steps or trigger changed, create new version
      if (dto.trigger || dto.steps || dto.edges) {
        const newVersionNum = latestVersion.version_num + 1;
        const newVersion = manager.create(WorkflowVersionEntity, {
          workflow_id: workflow.id,
          version_num: newVersionNum,
          s3_key: `s3://workflows/${workflow.id}/v${newVersionNum}.json`,
          inline_json: this.buildWorkflowJson({
            ...dto,
            name: workflow.name,
            segment: workflow.segment as any,
          } as CreateWorkflowDto),
        });
        latestVersion = await manager.save(newVersion);

        // Update definition latest version
        workflow.latestVersion = latestVersion;
        await manager.save(workflow);

        // Recreate trigger, steps, and edges for new version
        if (dto.trigger) {
          const trigger = manager.create(WorkflowTriggerEntity, {
            version_id: latestVersion.id,
            trigger_key: dto.trigger.triggerKey,
            filters: dto.trigger.filters,
          });
          await manager.save(trigger);
        }

        // Handle steps and edges if provided
        if (dto.steps && dto.edges) {
          await this.createStepsAndEdges(
            manager,
            latestVersion.id,
            dto.steps,
            dto.edges
          );
        }
      }

      return this.getWorkflow(id);
    });
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<WorkflowResponseDto[]> {
    const workflows = await this.workflowRepository.find({
      relations: ['latestVersion'],
      order: { created_at: 'DESC' },
    });

    return Promise.all(
      workflows.map((workflow) => this.getWorkflow(workflow.id))
    );
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const workflow = await this.workflowRepository.findOne({ where: { id } });
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    await this.workflowRepository.remove(workflow);
    this.logger.log(`Workflow deleted: ${id}`);
  }

  /**
   * Execute workflow manually
   */
  async executeWorkflow(
    id: string,
    dto: WorkflowExecutionDto
  ): Promise<{ success: boolean; runId?: string; error?: string }> {
    this.logger.log(`Manual execution requested for workflow: ${id}`);

    // Implementation would depend on your WorkflowEngineService
    // For now, return a placeholder response
    return {
      success: true,
      runId: 'manual-run-' + Date.now(),
    };
  }

  /**
   * Validate that trigger and actions exist in registry
   */
  private async validateWorkflowComponents(
    dto: Partial<CreateWorkflowDto>
  ): Promise<void> {
    if (dto.trigger) {
      const triggerExists = await this.triggerRegistryRepository.findOne({
        where: { key: dto.trigger.triggerKey },
      });
      if (!triggerExists) {
        throw new BadRequestException(
          `Trigger '${dto.trigger.triggerKey}' not found in registry`
        );
      }
    }

    if (dto.steps) {
      for (const step of dto.steps) {
        if (step.actionKey) {
          const actionExists = await this.actionRegistryRepository.findOne({
            where: { key: step.actionKey },
          });
          if (!actionExists) {
            throw new BadRequestException(
              `Action '${step.actionKey}' not found in registry`
            );
          }
        }
      }
    }
  }

  /**
   * Build workflow JSON for storage
   */
  private buildWorkflowJson(dto: CreateWorkflowDto): Record<string, any> {
    return {
      name: dto.name,
      description: dto.description,
      segment: dto.segment,
      trigger: dto.trigger,
      steps: dto.steps,
      edges: dto.edges,
      version: '1.0',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create steps and edges for a version
   */
  private async createStepsAndEdges(
    manager: any,
    versionId: string,
    steps: WorkflowStepDto[],
    edges: WorkflowEdgeDto[]
  ): Promise<void> {
    const stepMap = new Map<string, string>();

    // Create steps
    for (const stepDto of steps) {
      const step = manager.create(WorkflowStepEntity, {
        version_id: versionId,
        kind: stepDto.kind,
        action_key: stepDto.actionKey,
        cfg: stepDto.configuration.parameters,
        name: stepDto.name,
        resource: stepDto.configuration.resource,
        operation: stepDto.configuration.operation,
        credential_id: stepDto.configuration.credentialId,
      });
      const savedStep = await manager.save(step);
      stepMap.set(stepDto.name, savedStep.id);
    }

    // Create edges
    for (const edgeDto of edges) {
      const fromStepId = stepMap.get(edgeDto.fromStep);
      const toStepId = stepMap.get(edgeDto.toStep);

      if (fromStepId && toStepId) {
        const edge = manager.create(WorkflowEdgeEntity, {
          from_step_id: fromStepId,
          to_step_id: toStepId,
          branch_key: edgeDto.branchKey || 'default',
        });
        await manager.save(edge);
      }
    }
  }

  /**
   * Map entities to response DTO
   */
  private mapToResponseDto(
    definition: WorkflowDefinitionEntity,
    version: WorkflowVersionEntity,
    data?: any
  ): WorkflowResponseDto {
    return {
      id: definition.id,
      name: definition.name,
      description: data?.description,
      segment: definition.segment as any,
      latestVersion: version.version_num,
      isActive: definition.is_active,
      createdBy: definition.created_by,
      createdAt: definition.created_at,
      updatedAt: definition.updated_at,
      trigger: data?.trigger || version.inline_json?.trigger,
      steps: data?.steps || version.inline_json?.steps || [],
      edges: data?.edges || version.inline_json?.edges || [],
    };
  }
}
