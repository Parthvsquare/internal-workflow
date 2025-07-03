import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
} from '@internal-workflow/storage';
import {
  CreateActionRegistryDto,
  UpdateActionRegistryDto,
  ActionRegistryResponseDto,
} from './dto/action-registry.dto';
import {
  CreateTriggerRegistryDto,
  UpdateTriggerRegistryDto,
  TriggerRegistryResponseDto,
} from './dto/trigger-registry.dto';
// import { HttpService } from '@nestjs/axios';
// import { firstValueFrom } from 'rxjs';

@Injectable()
export class WorkflowRegistryService {
  constructor(
    @InjectRepository(WorkflowActionRegistryEntity)
    private readonly actionRepository: Repository<WorkflowActionRegistryEntity>,
    @InjectRepository(WorkflowTriggerRegistryEntity)
    private readonly triggerRepository: Repository<WorkflowTriggerRegistryEntity>,
    private dataSource: DataSource // private httpService: HttpService
  ) {}

  // Action Registry Methods
  async createAction(
    createDto: CreateActionRegistryDto
  ): Promise<ActionRegistryResponseDto> {
    const existingAction = await this.actionRepository.findOne({
      where: { key: createDto.key },
    });

    if (existingAction) {
      throw new ConflictException(
        `Action with key '${createDto.key}' already exists`
      );
    }

    const action = this.actionRepository.create({
      name: createDto.name,
      display_name: createDto.displayName,
      description: createDto.description,
      category: createDto.category,
      version: createDto.version || 1,
      is_active: createDto.isActive ?? true,
      properties_schema: createDto.propertiesSchema,
    });

    const savedAction = await this.actionRepository.save(action);
    return this.mapActionToResponse(savedAction);
  }

  async getAllActions(): Promise<ActionRegistryResponseDto[]> {
    const actions = await this.actionRepository.find({
      order: { created_at: 'DESC' },
    });
    return actions.map((action) => this.mapActionToResponse(action));
  }

  async getActiveActions(): Promise<ActionRegistryResponseDto[]> {
    const actions = await this.actionRepository.find({
      where: { is_active: true },
      order: { display_name: 'ASC' },
    });
    return actions.map((action) => this.mapActionToResponse(action));
  }

  async getActionByKey(key: string): Promise<ActionRegistryResponseDto> {
    const action = await this.actionRepository.findOne({
      where: { key },
    });

    if (!action) {
      throw new NotFoundException(`Action with key '${key}' not found`);
    }

    return this.mapActionToResponse(action);
  }

  async updateAction(
    key: string,
    updateDto: UpdateActionRegistryDto
  ): Promise<ActionRegistryResponseDto> {
    const action = await this.actionRepository.findOne({
      where: { key },
    });

    if (!action) {
      throw new NotFoundException(`Action with key '${key}' not found`);
    }

    if (updateDto.name) action.name = updateDto.name;
    if (updateDto.displayName) action.display_name = updateDto.displayName;
    if (updateDto.description !== undefined)
      action.description = updateDto.description;
    if (updateDto.category) action.category = updateDto.category;
    if (updateDto.version) action.version = updateDto.version;
    if (updateDto.isActive !== undefined) action.is_active = updateDto.isActive;
    if (updateDto.propertiesSchema)
      action.properties_schema = updateDto.propertiesSchema;

    action.updated_at = new Date();

    const updatedAction = await this.actionRepository.save(action);
    return this.mapActionToResponse(updatedAction);
  }

  async deleteAction(key: string): Promise<void> {
    const result = await this.actionRepository.delete({ key });

    if (result.affected === 0) {
      throw new NotFoundException(`Action with key '${key}' not found`);
    }
  }

  async getActionsByCategory(
    category: string
  ): Promise<ActionRegistryResponseDto[]> {
    const actions = await this.actionRepository.find({
      where: { category, is_active: true },
      order: { display_name: 'ASC' },
    });
    return actions.map((action) => this.mapActionToResponse(action));
  }

  // Trigger Registry Methods
  async createTrigger(
    createDto: CreateTriggerRegistryDto
  ): Promise<TriggerRegistryResponseDto> {
    const existingTrigger = await this.triggerRepository.findOne({
      where: { key: createDto.key },
    });

    if (existingTrigger) {
      throw new ConflictException(
        `Trigger with key '${createDto.key}' already exists`
      );
    }

    const trigger = this.triggerRepository.create({
      name: createDto.name,
      display_name: createDto.displayName,
      description: createDto.description,
      category: createDto.category,
      version: createDto.version || 1,
      is_active: createDto.isActive ?? true,
      properties_schema: createDto.propertiesSchema,
      filter_schema: createDto.filterSchema,
      sample_payload: createDto.samplePayload,
    });

    const savedTrigger = await this.triggerRepository.save(trigger);
    return this.mapTriggerToResponse(savedTrigger);
  }

  async getAllTriggers(): Promise<TriggerRegistryResponseDto[]> {
    const triggers = await this.triggerRepository.find({
      order: { created_at: 'DESC' },
    });
    return triggers.map((trigger) => this.mapTriggerToResponse(trigger));
  }

  async getActiveTriggers(): Promise<TriggerRegistryResponseDto[]> {
    const triggers = await this.triggerRepository.find({
      where: { is_active: true },
      order: { display_name: 'ASC' },
    });
    return triggers.map((trigger) => this.mapTriggerToResponse(trigger));
  }

  async getTriggerByKey(key: string): Promise<TriggerRegistryResponseDto> {
    const trigger = await this.triggerRepository.findOne({
      where: { key },
    });

    if (!trigger) {
      throw new NotFoundException(`Trigger with key '${key}' not found`);
    }

    return this.mapTriggerToResponse(trigger);
  }

  async updateTrigger(
    key: string,
    updateDto: UpdateTriggerRegistryDto
  ): Promise<TriggerRegistryResponseDto> {
    const trigger = await this.triggerRepository.findOne({
      where: { key },
    });

    if (!trigger) {
      throw new NotFoundException(`Trigger with key '${key}' not found`);
    }

    if (updateDto.eventSource) trigger.event_source = updateDto.eventSource;
    if (updateDto.name) trigger.name = updateDto.name;
    if (updateDto.displayName) trigger.display_name = updateDto.displayName;
    if (updateDto.description !== undefined)
      trigger.description = updateDto.description;
    if (updateDto.category) trigger.category = updateDto.category;
    if (updateDto.version) trigger.version = updateDto.version;
    if (updateDto.isActive !== undefined)
      trigger.is_active = updateDto.isActive;
    if (updateDto.propertiesSchema)
      trigger.properties_schema = updateDto.propertiesSchema;
    if (updateDto.filterSchema) trigger.filter_schema = updateDto.filterSchema;
    if (updateDto.samplePayload)
      trigger.sample_payload = updateDto.samplePayload;

    trigger.updated_at = new Date();

    const updatedTrigger = await this.triggerRepository.save(trigger);
    return this.mapTriggerToResponse(updatedTrigger);
  }

  async deleteTrigger(key: string): Promise<void> {
    const result = await this.triggerRepository.delete({ key });

    if (result.affected === 0) {
      throw new NotFoundException(`Trigger with key '${key}' not found`);
    }
  }

  async getTriggersByCategory(
    category: string
  ): Promise<TriggerRegistryResponseDto[]> {
    const triggers = await this.triggerRepository.find({
      where: { category, is_active: true },
      order: { display_name: 'ASC' },
    });
    return triggers.map((trigger) => this.mapTriggerToResponse(trigger));
  }

  async getTriggersByEventSource(
    eventSource: string
  ): Promise<TriggerRegistryResponseDto[]> {
    const triggers = await this.triggerRepository.find({
      where: { event_source: eventSource, is_active: true },
      order: { display_name: 'ASC' },
    });
    return triggers.map((trigger) => this.mapTriggerToResponse(trigger));
  }

  // Helper Methods
  private mapActionToResponse(
    action: WorkflowActionRegistryEntity
  ): ActionRegistryResponseDto {
    return {
      key: action.key,
      name: action.name,
      displayName: action.display_name || action.name,
      description: action.description,
      category: action.category as any,
      group: ['action'] as any, // Default since not in current entity
      icon: '', // Not in current entity
      iconColor: '', // Not in current entity
      documentationUrl: '', // Not in current entity
      version: action.version,
      isActive: action.is_active,
      propertiesSchema: action.properties_schema || {},
      credentialsSchema: {}, // Not in current entity
      operationSchema: {}, // Not in current entity
      createdAt: action.created_at,
      updatedAt: action.updated_at,
    };
  }

  private mapTriggerToResponse(
    trigger: WorkflowTriggerRegistryEntity
  ): TriggerRegistryResponseDto {
    return {
      key: trigger.key,
      name: trigger.name,
      displayName: trigger.display_name || trigger.name,
      description: trigger.description,
      category: trigger.category as any,
      eventSource: trigger.event_source as any,
      version: trigger.version,
      isActive: trigger.is_active,
      propertiesSchema: trigger.properties_schema || {},
      filterSchema: trigger.filter_schema || {},
      samplePayload: trigger.sample_payload || {},
      webhookConfig: trigger.webhook_config || {},
      availableVariables: trigger.available_variables || {},
      createdAt: trigger.created_at,
      updatedAt: trigger.updated_at,
    };
  }

  async resolveDataSource(
    dataSourceConfig: any,
    context?: any
  ): Promise<Array<{ name: string; value: string }>> {
    switch (dataSourceConfig.type) {
      case 'database':
        return this.resolveDatabaseDataSource(dataSourceConfig, context);
      case 'static':
        return dataSourceConfig.options || [];
      default:
        throw new HttpException(
          `Unknown data source type: ${dataSourceConfig.type}`,
          HttpStatus.BAD_REQUEST
        );
    }
  }

  private async resolveDatabaseDataSource(
    config: any,
    context?: any
  ): Promise<Array<{ name: string; value: string }>> {
    try {
      let query = `SELECT ${config.valueColumn} as value, ${config.labelColumn} as name FROM ${config.table}`;

      if (config.whereClause) {
        const whereClause = this.interpolateVariables(
          config.whereClause,
          context
        );
        query += ` WHERE ${whereClause}`;
      }

      if (config.orderBy) {
        query += ` ORDER BY ${config.orderBy}`;
      }

      const result = await this.dataSource.query(query);
      return result.map((row: any) => ({
        name: row.name,
        value: row.value,
      }));
    } catch (error) {
      console.error('Error resolving database data source:', error);
      return [];
    }
  }

  private interpolateVariables(template: any, context?: any): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context?.[key] || match;
      });
    } else if (typeof template === 'object' && template !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.interpolateVariables(value, context);
      }
      return result;
    }
    return template;
  }

  async getTriggerWithResolvedSchema(key: string, context?: any): Promise<any> {
    const trigger = await this.triggerRepository.findOne({ where: { key } });
    if (!trigger) {
      throw new HttpException('Trigger not found', HttpStatus.NOT_FOUND);
    }

    // Resolve dynamic data sources in filter_schema
    if (trigger.filter_schema && Array.isArray(trigger.filter_schema)) {
      for (const field of trigger.filter_schema) {
        if (field.dataSource) {
          field.options = await this.resolveDataSource(
            field.dataSource,
            context
          );
        }
      }
    }

    // Resolve dynamic data sources in properties_schema
    if (trigger.properties_schema && Array.isArray(trigger.properties_schema)) {
      for (const property of trigger.properties_schema) {
        if (property.dataSource) {
          property.options = await this.resolveDataSource(
            property.dataSource,
            context
          );
        }
      }
    }

    return trigger;
  }

  async getActionWithResolvedSchema(key: string, context?: any): Promise<any> {
    const action = await this.actionRepository.findOne({ where: { key } });
    if (!action) {
      throw new HttpException('Action not found', HttpStatus.NOT_FOUND);
    }

    // Resolve dynamic data sources in properties_schema
    if (action.properties_schema && Array.isArray(action.properties_schema)) {
      for (const property of action.properties_schema) {
        if (property.dataSource) {
          property.options = await this.resolveDataSource(
            property.dataSource,
            context
          );
        }
      }
    }

    return action;
  }
}
