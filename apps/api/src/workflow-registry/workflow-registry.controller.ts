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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { WorkflowRegistryService } from './workflow-registry.service';
import { WorkflowEngineService } from './services/workflow-engine.service';
// Kafka consumer moved to worker-service
import {
  CreateActionRegistryDto,
  UpdateActionRegistryDto,
  ActionRegistryResponseDto,
  ActionCategory,
} from './dto/action-registry.dto';
import {
  CreateTriggerRegistryDto,
  UpdateTriggerRegistryDto,
  TriggerRegistryResponseDto,
  TriggerCategory,
  EventSource,
} from './dto/trigger-registry.dto';

@ApiTags('workflow-registry')
@Controller('workflow-registry')
export class WorkflowRegistryController {
  constructor(
    private readonly workflowRegistryService: WorkflowRegistryService,
    private readonly workflowEngine: WorkflowEngineService
  ) {}

  // Action Registry Endpoints
  @Post('actions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new action',
    description:
      'Creates a new workflow action in the registry with specified properties and schema',
  })
  @ApiBody({ type: CreateActionRegistryDto })
  @ApiCreatedResponse({
    description: 'Action created successfully',
    type: ActionRegistryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'Action with the same key already exists',
  })
  async createAction(
    @Body() createDto: CreateActionRegistryDto
  ): Promise<ActionRegistryResponseDto> {
    return this.workflowRegistryService.createAction(createDto);
  }

  @Get('actions')
  @ApiOperation({
    summary: 'Get all actions',
    description:
      'Retrieves all workflow actions from the registry with optional filtering',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Filter by active status (true/false)',
    example: 'true',
  })
  @ApiOkResponse({
    description: 'List of actions retrieved successfully',
    type: [ActionRegistryResponseDto],
  })
  async getAllActions(
    @Query('active') active?: string
  ): Promise<ActionRegistryResponseDto[]> {
    if (active === 'true') {
      return this.workflowRegistryService.getActiveActions();
    }
    return this.workflowRegistryService.getAllActions();
  }

  @Get('actions/category/:category')
  @ApiOperation({
    summary: 'Get actions by category',
    description: 'Retrieves all active workflow actions filtered by category',
  })
  @ApiParam({
    name: 'category',
    description: 'Action category to filter by',
    enum: ActionCategory,
    example: ActionCategory.COMMUNICATION,
  })
  @ApiOkResponse({
    description: 'List of actions in the specified category',
    type: [ActionRegistryResponseDto],
  })
  async getActionsByCategory(
    @Param('category') category: string
  ): Promise<ActionRegistryResponseDto[]> {
    return this.workflowRegistryService.getActionsByCategory(category);
  }

  @Get('actions/:key')
  @ApiOperation({
    summary: 'Get action by key',
    description: 'Retrieves a specific workflow action by its unique key',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique action key',
    example: 'send_email',
  })
  @ApiOkResponse({
    description: 'Action retrieved successfully',
    type: ActionRegistryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Action not found' })
  async getActionByKey(
    @Param('key') key: string
  ): Promise<ActionRegistryResponseDto> {
    return this.workflowRegistryService.getActionByKey(key);
  }

  @Put('actions/:key')
  @ApiOperation({
    summary: 'Update action',
    description: 'Updates an existing workflow action with new properties',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique action key',
    example: 'send_email',
  })
  @ApiBody({ type: UpdateActionRegistryDto })
  @ApiOkResponse({
    description: 'Action updated successfully',
    type: ActionRegistryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Action not found' })
  async updateAction(
    @Param('key') key: string,
    @Body() updateDto: UpdateActionRegistryDto
  ): Promise<ActionRegistryResponseDto> {
    return this.workflowRegistryService.updateAction(key, updateDto);
  }

  @Delete('actions/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete action',
    description: 'Permanently deletes a workflow action from the registry',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique action key',
    example: 'send_email',
  })
  @ApiNoContentResponse({ description: 'Action deleted successfully' })
  @ApiNotFoundResponse({ description: 'Action not found' })
  async deleteAction(@Param('key') key: string): Promise<void> {
    return this.workflowRegistryService.deleteAction(key);
  }

  // Trigger Registry Endpoints
  @Post('triggers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new trigger',
    description:
      'Creates a new workflow trigger in the registry with specified properties and configuration',
  })
  @ApiBody({ type: CreateTriggerRegistryDto })
  @ApiCreatedResponse({
    description: 'Trigger created successfully',
    type: TriggerRegistryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'Trigger with the same key already exists',
  })
  async createTrigger(
    @Body() createDto: CreateTriggerRegistryDto
  ): Promise<TriggerRegistryResponseDto> {
    return this.workflowRegistryService.createTrigger(createDto);
  }

  @Get('triggers')
  @ApiOperation({
    summary: 'Get all triggers',
    description:
      'Retrieves all workflow triggers from the registry with optional filtering',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'Filter by active status (true/false)',
    example: 'true',
  })
  @ApiOkResponse({
    description: 'List of triggers retrieved successfully',
    type: [TriggerRegistryResponseDto],
  })
  async getAllTriggers(
    @Query('active') active?: string
  ): Promise<TriggerRegistryResponseDto[]> {
    if (active === 'true') {
      return this.workflowRegistryService.getActiveTriggers();
    }
    return this.workflowRegistryService.getAllTriggers();
  }

  @Get('triggers/category/:category')
  @ApiOperation({
    summary: 'Get triggers by category',
    description: 'Retrieves all active workflow triggers filtered by category',
  })
  @ApiParam({
    name: 'category',
    description: 'Trigger category to filter by',
    enum: TriggerCategory,
    example: TriggerCategory.WEBHOOK,
  })
  @ApiOkResponse({
    description: 'List of triggers in the specified category',
    type: [TriggerRegistryResponseDto],
  })
  async getTriggersByCategory(
    @Param('category') category: string
  ): Promise<TriggerRegistryResponseDto[]> {
    return this.workflowRegistryService.getTriggersByCategory(category);
  }

  @Get('triggers/event-source/:eventSource')
  @ApiOperation({
    summary: 'Get triggers by event source',
    description:
      'Retrieves all active workflow triggers filtered by event source type',
  })
  @ApiParam({
    name: 'eventSource',
    description: 'Event source type to filter by',
    enum: EventSource,
    example: EventSource.WEBHOOK,
  })
  @ApiOkResponse({
    description: 'List of triggers with the specified event source',
    type: [TriggerRegistryResponseDto],
  })
  async getTriggersByEventSource(
    @Param('eventSource') eventSource: string
  ): Promise<TriggerRegistryResponseDto[]> {
    return this.workflowRegistryService.getTriggersByEventSource(eventSource);
  }

  @Get('triggers/:key')
  @ApiOperation({
    summary: 'Get trigger by key',
    description: 'Retrieves a specific workflow trigger by its unique key',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique trigger key',
    example: 'webhook_received',
  })
  @ApiOkResponse({
    description: 'Trigger retrieved successfully',
    type: TriggerRegistryResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Trigger not found' })
  async getTriggerByKey(
    @Param('key') key: string
  ): Promise<TriggerRegistryResponseDto> {
    return this.workflowRegistryService.getTriggerByKey(key);
  }

  @Put('triggers/:key')
  @ApiOperation({
    summary: 'Update trigger',
    description:
      'Updates an existing workflow trigger with new properties and configuration',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique trigger key',
    example: 'webhook_received',
  })
  @ApiBody({ type: UpdateTriggerRegistryDto })
  @ApiOkResponse({
    description: 'Trigger updated successfully',
    type: TriggerRegistryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Trigger not found' })
  async updateTrigger(
    @Param('key') key: string,
    @Body() updateDto: UpdateTriggerRegistryDto
  ): Promise<TriggerRegistryResponseDto> {
    return this.workflowRegistryService.updateTrigger(key, updateDto);
  }

  @Delete('triggers/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete trigger',
    description: 'Permanently deletes a workflow trigger from the registry',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique trigger key',
    example: 'webhook_received',
  })
  @ApiNoContentResponse({ description: 'Trigger deleted successfully' })
  @ApiNotFoundResponse({ description: 'Trigger not found' })
  async deleteTrigger(@Param('key') key: string): Promise<void> {
    return this.workflowRegistryService.deleteTrigger(key);
  }

  @Get('trigger/:key/resolved')
  async getTriggerWithResolvedSchema(
    @Param('key') key: string,
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string
  ) {
    const context = { tenant_id: tenantId, user_id: userId };
    return this.workflowRegistryService.getTriggerWithResolvedSchema(
      key,
      context
    );
  }

  @Get('action/:key/resolved')
  async getActionWithResolvedSchema(
    @Param('key') key: string,
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string
  ) {
    const context = { tenant_id: tenantId, user_id: userId };
    return this.workflowRegistryService.getActionWithResolvedSchema(
      key,
      context
    );
  }

  // Utility Endpoints
  @Get('schema/action-properties')
  @ApiOperation({
    summary: 'Get action property schema',
    description:
      'Returns the schema definition for action properties to help with UI form generation',
  })
  @ApiOkResponse({
    description: 'Action property schema retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              displayName: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              required: { type: 'boolean' },
              options: { type: 'array' },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get trigger property schema',
    description:
      'Returns the schema definition for trigger properties to help with UI form generation',
  })
  @ApiOkResponse({
    description: 'Trigger property schema retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              displayName: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              required: { type: 'boolean' },
              options: { type: 'array' },
            },
          },
        },
      },
    },
  })
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

  @Post('trigger/:triggerKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process trigger event' })
  @ApiParam({ name: 'triggerKey', description: 'Trigger key to process' })
  @ApiBody({
    description: 'Trigger event data',
    schema: {
      type: 'object',
      properties: {
        eventData: { type: 'object' },
        context: { type: 'object' },
      },
    },
  })
  @ApiOkResponse({ description: 'Trigger processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid trigger data' })
  async processTrigger(
    @Param('triggerKey') triggerKey: string,
    @Body() body: { eventData: any; context?: any }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.workflowEngine.processTriggerEvent(
        triggerKey,
        body.eventData,
        body.context || {}
      );

      return {
        success: true,
        message: `Trigger ${triggerKey} processed successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
