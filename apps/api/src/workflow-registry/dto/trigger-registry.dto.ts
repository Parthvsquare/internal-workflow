import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TriggerCategory {
  WEBHOOK = 'webhook',
  DATABASE = 'database',
  SCHEDULE = 'schedule',
  EMAIL = 'email',
  EXTERNAL = 'external',
  MANUAL = 'manual',
}

export enum EventSource {
  WEBHOOK = 'webhook',
  DEBEZIUM = 'debezium',
  POLL = 'poll',
  MANUAL = 'manual',
}

export class CreateTriggerRegistryDto {
  @ApiProperty({
    description: 'Unique key for the trigger',
    example: 'webhook_received',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    description: 'Internal name of the trigger',
    example: 'webhookReceived',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Display name shown in UI',
    example: 'Webhook Received',
  })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Trigger description',
    example: 'Triggers when a webhook is received',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: TriggerCategory,
    description: 'Trigger category',
    example: TriggerCategory.WEBHOOK,
  })
  @IsEnum(TriggerCategory)
  category!: TriggerCategory;

  @ApiProperty({
    enum: EventSource,
    description: 'Event source type',
    example: EventSource.WEBHOOK,
  })
  @IsEnum(EventSource)
  eventSource!: EventSource;

  @ApiPropertyOptional({
    description: 'Trigger version',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({
    description: 'Whether trigger is active',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Node properties schema definition',
    example: {
      properties: [
        {
          displayName: 'HTTP Method',
          name: 'method',
          type: 'options',
          required: true,
          options: [
            { name: 'POST', value: 'POST' },
            { name: 'GET', value: 'GET' },
          ],
        },
      ],
    },
  })
  @IsObject()
  propertiesSchema!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available filter conditions schema',
    example: {
      fields: [
        {
          displayName: 'Request Body',
          name: 'body',
          type: 'object',
          operators: ['exists', 'not_exists'],
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  filterSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sample payload structure',
    example: {
      method: 'POST',
      headers: {},
      body: {},
      timestamp: '2023-12-01T10:00:00Z',
    },
  })
  @IsOptional()
  @IsObject()
  samplePayload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Webhook-specific configuration',
    example: {
      methods: ['POST', 'PUT'],
      auth_required: false,
      response_mode: 'onReceived',
    },
  })
  @IsOptional()
  @IsObject()
  webhookConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available variables for filtering',
    example: {
      headers: 'object',
      body: 'object',
      query: 'object',
      method: 'string',
    },
  })
  @IsOptional()
  @IsObject()
  availableVariables?: Record<string, any>;
}

export class UpdateTriggerRegistryDto {
  @ApiPropertyOptional({
    description: 'Internal name of the trigger',
    example: 'webhookReceived',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Display name shown in UI',
    example: 'Webhook Received',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Trigger description',
    example: 'Triggers when a webhook is received',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: TriggerCategory,
    description: 'Trigger category',
    example: TriggerCategory.WEBHOOK,
  })
  @IsOptional()
  @IsEnum(TriggerCategory)
  category?: TriggerCategory;

  @ApiPropertyOptional({
    enum: EventSource,
    description: 'Event source type',
    example: EventSource.WEBHOOK,
  })
  @IsOptional()
  @IsEnum(EventSource)
  eventSource?: EventSource;

  @ApiPropertyOptional({
    description: 'Trigger version',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({
    description: 'Whether trigger is active',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Node properties schema definition',
    example: {
      properties: [
        {
          displayName: 'HTTP Method',
          name: 'method',
          type: 'options',
          required: true,
          options: [
            { name: 'POST', value: 'POST' },
            { name: 'GET', value: 'GET' },
          ],
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  propertiesSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available filter conditions schema',
    example: {
      fields: [
        {
          displayName: 'Request Body',
          name: 'body',
          type: 'object',
          operators: ['exists', 'not_exists'],
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  filterSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sample payload structure',
    example: {
      method: 'POST',
      headers: {},
      body: {},
      timestamp: '2023-12-01T10:00:00Z',
    },
  })
  @IsOptional()
  @IsObject()
  samplePayload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Webhook-specific configuration',
    example: {
      methods: ['POST', 'PUT'],
      auth_required: false,
      response_mode: 'onReceived',
    },
  })
  @IsOptional()
  @IsObject()
  webhookConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available variables for filtering',
    example: {
      headers: 'object',
      body: 'object',
      query: 'object',
      method: 'string',
    },
  })
  @IsOptional()
  @IsObject()
  availableVariables?: Record<string, any>;
}

export class TriggerRegistryResponseDto {
  @ApiProperty({
    description: 'Unique trigger key',
    example: 'webhook_received',
  })
  key!: string;

  @ApiProperty({ description: 'Trigger name', example: 'webhookReceived' })
  name!: string;

  @ApiProperty({ description: 'Display name', example: 'Webhook Received' })
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Trigger description',
    example: 'Triggers when a webhook is received',
  })
  description?: string;

  @ApiProperty({
    enum: TriggerCategory,
    description: 'Trigger category',
    example: TriggerCategory.WEBHOOK,
  })
  category!: TriggerCategory;

  @ApiProperty({
    enum: EventSource,
    description: 'Event source type',
    example: EventSource.WEBHOOK,
  })
  eventSource!: EventSource;

  @ApiProperty({ description: 'Trigger version', example: 1 })
  version!: number;

  @ApiProperty({ description: 'Whether trigger is active', example: true })
  isActive!: boolean;

  @ApiProperty({
    description: 'Properties schema',
    example: {
      properties: [
        {
          displayName: 'HTTP Method',
          name: 'method',
          type: 'options',
          required: true,
          options: [
            { name: 'POST', value: 'POST' },
            { name: 'GET', value: 'GET' },
          ],
        },
      ],
    },
  })
  propertiesSchema!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Filter schema',
    example: {
      fields: [
        {
          displayName: 'Request Body',
          name: 'body',
          type: 'object',
          operators: ['exists', 'not_exists'],
        },
      ],
    },
  })
  filterSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sample payload',
    example: {
      method: 'POST',
      headers: {},
      body: {},
      timestamp: '2023-12-01T10:00:00Z',
    },
  })
  samplePayload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Webhook configuration',
    example: {
      methods: ['POST', 'PUT'],
      auth_required: false,
      response_mode: 'onReceived',
    },
  })
  webhookConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available variables',
    example: {
      headers: 'object',
      body: 'object',
      query: 'object',
      method: 'string',
    },
  })
  availableVariables?: Record<string, any>;

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
}
