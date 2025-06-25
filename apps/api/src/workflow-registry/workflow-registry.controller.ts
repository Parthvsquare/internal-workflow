import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkflowRegistryService } from './workflow-registry.service';
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

@Controller('workflow-registry')
export class WorkflowRegistryController {
  constructor(
    private readonly workflowRegistryService: WorkflowRegistryService
  ) {}

  // Action Registry Endpoints
  @Post('actions')
  @HttpCode(HttpStatus.CREATED)
  async createAction(
    @Body() createDto: CreateActionRegistryDto
  ): Promise<ActionRegistryResponseDto> {
    return this.workflowRegistryService.createAction(createDto);
  }

  @Get('actions')
  async getAllActions(
    @Query('active') active?: string
  ): Promise<ActionRegistryResponseDto[]> {
    if (active === 'true') {
      return this.workflowRegistryService.getActiveActions();
    }
    return this.workflowRegistryService.getAllActions();
  }

  @Get('actions/category/:category')
  async getActionsByCategory(
    @Param('category') category: string
  ): Promise<ActionRegistryResponseDto[]> {
    return this.workflowRegistryService.getActionsByCategory(category);
  }

  @Get('actions/:key')
  async getActionByKey(
    @Param('key') key: string
  ): Promise<ActionRegistryResponseDto> {
    return this.workflowRegistryService.getActionByKey(key);
  }

  @Put('actions/:key')
  async updateAction(
    @Param('key') key: string,
    @Body() updateDto: UpdateActionRegistryDto
  ): Promise<ActionRegistryResponseDto> {
    return this.workflowRegistryService.updateAction(key, updateDto);
  }

  @Delete('actions/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAction(@Param('key') key: string): Promise<void> {
    return this.workflowRegistryService.deleteAction(key);
  }

  // Trigger Registry Endpoints
  @Post('triggers')
  @HttpCode(HttpStatus.CREATED)
  async createTrigger(
    @Body() createDto: CreateTriggerRegistryDto
  ): Promise<TriggerRegistryResponseDto> {
    return this.workflowRegistryService.createTrigger(createDto);
  }

  @Get('triggers')
  async getAllTriggers(
    @Query('active') active?: string
  ): Promise<TriggerRegistryResponseDto[]> {
    if (active === 'true') {
      return this.workflowRegistryService.getActiveTriggers();
    }
    return this.workflowRegistryService.getAllTriggers();
  }

  @Get('triggers/category/:category')
  async getTriggersByCategory(
    @Param('category') category: string
  ): Promise<TriggerRegistryResponseDto[]> {
    return this.workflowRegistryService.getTriggersByCategory(category);
  }

  @Get('triggers/event-source/:eventSource')
  async getTriggersByEventSource(
    @Param('eventSource') eventSource: string
  ): Promise<TriggerRegistryResponseDto[]> {
    return this.workflowRegistryService.getTriggersByEventSource(eventSource);
  }

  @Get('triggers/:key')
  async getTriggerByKey(
    @Param('key') key: string
  ): Promise<TriggerRegistryResponseDto> {
    return this.workflowRegistryService.getTriggerByKey(key);
  }

  @Put('triggers/:key')
  async updateTrigger(
    @Param('key') key: string,
    @Body() updateDto: UpdateTriggerRegistryDto
  ): Promise<TriggerRegistryResponseDto> {
    return this.workflowRegistryService.updateTrigger(key, updateDto);
  }

  @Delete('triggers/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTrigger(@Param('key') key: string): Promise<void> {
    return this.workflowRegistryService.deleteTrigger(key);
  }

  // Utility Endpoints
  @Get('schema/action-properties')
  async getActionPropertySchema(): Promise<any> {
    // Return sample schema for UI form generation
    return {
      properties: [
        {
          displayName: 'Action Name',
          name: 'name',
          type: 'string',
          required: true,
          placeholder: 'Enter action name',
        },
        {
          displayName: 'Display Name',
          name: 'displayName',
          type: 'string',
          required: true,
          placeholder: 'Enter display name',
        },
        {
          displayName: 'Description',
          name: 'description',
          type: 'string',
          placeholder: 'Enter description',
        },
        {
          displayName: 'Category',
          name: 'category',
          type: 'options',
          required: true,
          options: [
            { name: 'Internal', value: 'internal' },
            { name: 'External', value: 'external' },
            { name: 'AI', value: 'ai' },
            { name: 'Communication', value: 'communication' },
            { name: 'Database', value: 'database' },
            { name: 'Transform', value: 'transform' },
            { name: 'Logic', value: 'logic' },
          ],
        },
      ],
    };
  }

  @Get('schema/trigger-properties')
  async getTriggerPropertySchema(): Promise<any> {
    // Return sample schema for UI form generation
    return {
      properties: [
        {
          displayName: 'Trigger Name',
          name: 'name',
          type: 'string',
          required: true,
          placeholder: 'Enter trigger name',
        },
        {
          displayName: 'Display Name',
          name: 'displayName',
          type: 'string',
          required: true,
          placeholder: 'Enter display name',
        },
        {
          displayName: 'Description',
          name: 'description',
          type: 'string',
          placeholder: 'Enter description',
        },
        {
          displayName: 'Category',
          name: 'category',
          type: 'options',
          required: true,
          options: [
            { name: 'Webhook', value: 'webhook' },
            { name: 'Database', value: 'database' },
            { name: 'Schedule', value: 'schedule' },
            { name: 'Email', value: 'email' },
            { name: 'External', value: 'external' },
            { name: 'Manual', value: 'manual' },
          ],
        },
        {
          displayName: 'Event Source',
          name: 'eventSource',
          type: 'options',
          required: true,
          options: [
            { name: 'Webhook', value: 'webhook' },
            { name: 'Debezium', value: 'debezium' },
            { name: 'Poll', value: 'poll' },
            { name: 'Manual', value: 'manual' },
          ],
        },
      ],
    };
  }
}
