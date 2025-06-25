import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  IsNumber,
} from 'class-validator';

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
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TriggerCategory)
  category!: TriggerCategory;

  @IsEnum(EventSource)
  eventSource!: EventSource;

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsObject()
  propertiesSchema!: Record<string, any>;

  @IsOptional()
  @IsObject()
  filterSchema?: Record<string, any>;

  @IsOptional()
  @IsObject()
  samplePayload?: Record<string, any>;

  @IsOptional()
  @IsObject()
  webhookConfig?: Record<string, any>;

  @IsOptional()
  @IsObject()
  availableVariables?: Record<string, any>;
}

export class UpdateTriggerRegistryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TriggerCategory)
  category?: TriggerCategory;

  @IsOptional()
  @IsEnum(EventSource)
  eventSource?: EventSource;

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  propertiesSchema?: Record<string, any>;

  @IsOptional()
  @IsObject()
  filterSchema?: Record<string, any>;

  @IsOptional()
  @IsObject()
  samplePayload?: Record<string, any>;

  @IsOptional()
  @IsObject()
  webhookConfig?: Record<string, any>;

  @IsOptional()
  @IsObject()
  availableVariables?: Record<string, any>;
}

export class TriggerRegistryResponseDto {
  key!: string;
  name!: string;
  displayName!: string;
  description?: string;
  category!: TriggerCategory;
  eventSource!: EventSource;
  version!: number;
  isActive!: boolean;
  propertiesSchema!: Record<string, any>;
  filterSchema?: Record<string, any>;
  samplePayload?: Record<string, any>;
  webhookConfig?: Record<string, any>;
  availableVariables?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
}
