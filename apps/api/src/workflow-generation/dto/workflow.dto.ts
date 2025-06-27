import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsEnum,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum WorkflowSegment {
  CRM = 'CRM',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
}

export enum StepKind {
  ACTION = 'ACTION',
  CONDITION = 'CONDITION',
  DELAY = 'DELAY',
  LOOP = 'LOOP',
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  AFTER = 'after',
  BEFORE = 'before',
}

export enum FilterCombinator {
  AND = 'AND',
  OR = 'OR',
}

export class FilterConditionDto {
  @ApiProperty({
    description: 'Variable path to filter on',
    example: '{{variable.lead_status}}',
  })
  @IsString()
  variable!: string;

  @ApiProperty({
    enum: FilterOperator,
    description: 'Filter operator',
    example: FilterOperator.EQUALS,
  })
  @IsEnum(FilterOperator)
  operator!: FilterOperator;

  @ApiProperty({
    description: 'Value to compare against',
    example: 'new',
  })
  value!: any;

  @ApiProperty({
    description: 'Data type of the value',
    enum: ['string', 'number', 'boolean', 'date'],
    example: 'string',
  })
  @IsString()
  type!: string;
}

export class FilterGroupDto {
  @ApiProperty({
    enum: FilterCombinator,
    description: 'How to combine conditions',
    example: FilterCombinator.AND,
  })
  @IsEnum(FilterCombinator)
  combinator!: FilterCombinator;

  @ApiProperty({
    type: [FilterConditionDto],
    description: 'Array of filter conditions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  @ArrayMinSize(1)
  conditions!: FilterConditionDto[];
}

export class StepConfigurationDto {
  @ApiProperty({
    description: 'Step configuration parameters',
    example: {
      title: 'Follow up with lead',
      description: 'Call the lead to discuss proposal',
      status: 'pending',
      entityType: 'crm_leads',
    },
  })
  @IsObject()
  parameters!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Resource name for resource/operation pattern',
    example: 'task',
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({
    description: 'Operation to perform on the resource',
    example: 'create',
  })
  @IsOptional()
  @IsString()
  operation?: string;

  @ApiPropertyOptional({
    description: 'Credential ID for external actions',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  credentialId?: string;
}

export class WorkflowStepDto {
  @ApiProperty({
    description: 'Step name/label',
    example: 'Create Follow-up Task',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    enum: StepKind,
    description: 'Type of step',
    example: StepKind.ACTION,
  })
  @IsEnum(StepKind)
  kind!: StepKind;

  @ApiPropertyOptional({
    description: 'Action key from action registry',
    example: 'taskManagement',
  })
  @IsOptional()
  @IsString()
  actionKey?: string;

  @ApiProperty({
    type: StepConfigurationDto,
    description: 'Step configuration',
  })
  @ValidateNested()
  @Type(() => StepConfigurationDto)
  configuration!: StepConfigurationDto;
}

export class WorkflowEdgeDto {
  @ApiProperty({
    description: 'Source step name',
    example: 'trigger',
  })
  @IsString()
  fromStep!: string;

  @ApiProperty({
    description: 'Target step name',
    example: 'Create Follow-up Task',
  })
  @IsString()
  toStep!: string;

  @ApiPropertyOptional({
    description: 'Branch key for conditional flows',
    default: 'default',
    example: 'default',
  })
  @IsOptional()
  @IsString()
  branchKey?: string;
}

export class TriggerConfigurationDto {
  @ApiProperty({
    description: 'Trigger key from trigger registry',
    example: 'lead_database_change',
  })
  @IsString()
  triggerKey!: string;

  @ApiProperty({
    description: 'Trigger properties/configuration',
    example: {
      table_name: 'leads',
      change_type: ['UPDATE'],
      monitor_fields: ['status'],
    },
  })
  @IsObject()
  properties!: Record<string, any>;

  @ApiPropertyOptional({
    type: FilterGroupDto,
    description: 'Filter conditions for the trigger',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterGroupDto)
  filters?: FilterGroupDto;
}

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Workflow name',
    example: 'Lead Status Change to Task Creation',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    example: 'Automatically create follow-up tasks when lead status changes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: WorkflowSegment,
    description: 'Workflow segment',
    example: WorkflowSegment.CRM,
  })
  @IsEnum(WorkflowSegment)
  segment!: WorkflowSegment;

  @ApiProperty({
    type: TriggerConfigurationDto,
    description: 'Trigger configuration',
  })
  @ValidateNested()
  @Type(() => TriggerConfigurationDto)
  trigger!: TriggerConfigurationDto;

  @ApiProperty({
    type: [WorkflowStepDto],
    description: 'Workflow steps',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  @ArrayMinSize(1)
  steps!: WorkflowStepDto[];

  @ApiProperty({
    type: [WorkflowEdgeDto],
    description: 'Connections between steps',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges!: WorkflowEdgeDto[];

  @ApiPropertyOptional({
    description: 'Whether workflow is active',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'User ID who created the workflow',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({
    description: 'Workflow name',
    example: 'Updated Lead Status Change to Task Creation',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    example: 'Updated description for the workflow',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: WorkflowSegment,
    description: 'Workflow segment',
    example: WorkflowSegment.CRM,
  })
  @IsOptional()
  @IsEnum(WorkflowSegment)
  segment?: WorkflowSegment;

  @ApiPropertyOptional({
    type: TriggerConfigurationDto,
    description: 'Updated trigger configuration',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerConfigurationDto)
  trigger?: TriggerConfigurationDto;

  @ApiPropertyOptional({
    type: [WorkflowStepDto],
    description: 'Updated workflow steps',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps?: WorkflowStepDto[];

  @ApiPropertyOptional({
    type: [WorkflowEdgeDto],
    description: 'Updated connections between steps',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges?: WorkflowEdgeDto[];

  @ApiPropertyOptional({
    description: 'Whether workflow is active',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WorkflowResponseDto {
  @ApiProperty({
    description: 'Workflow ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Workflow name',
    example: 'Lead Status Change to Task Creation',
  })
  name!: string;

  @ApiProperty({ description: 'Workflow description' })
  description?: string;

  @ApiProperty({ enum: WorkflowSegment, description: 'Workflow segment' })
  segment!: WorkflowSegment;

  @ApiProperty({ description: 'Latest version number', example: 1 })
  latestVersion!: number;

  @ApiProperty({ description: 'Whether workflow is active', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'User ID who created the workflow' })
  createdBy?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-01T15:30:00Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    type: TriggerConfigurationDto,
    description: 'Trigger configuration',
  })
  trigger!: TriggerConfigurationDto;

  @ApiProperty({ type: [WorkflowStepDto], description: 'Workflow steps' })
  steps!: WorkflowStepDto[];

  @ApiProperty({
    type: [WorkflowEdgeDto],
    description: 'Connections between steps',
  })
  edges!: WorkflowEdgeDto[];
}

export class WorkflowExecutionDto {
  @ApiProperty({
    description: 'Trigger data that started the workflow',
    example: {
      eventId: 'abc123',
      leadId: 'lead_12345',
      oldStatus: 'new',
      newStatus: 'contacted',
    },
  })
  @IsObject()
  triggerData!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional variables to pass to workflow',
    example: { customField: 'value' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User ID executing the workflow',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
