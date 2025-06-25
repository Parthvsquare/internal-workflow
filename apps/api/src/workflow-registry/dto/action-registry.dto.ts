import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsEnum,
  IsNumber,
} from 'class-validator';

export enum ActionCategory {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  AI = 'ai',
  COMMUNICATION = 'communication',
  DATABASE = 'database',
  TRANSFORM = 'transform',
  LOGIC = 'logic',
}

export enum ActionGroup {
  ACTION = 'action',
  TRIGGER = 'trigger',
}

export class CreateActionRegistryDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActionCategory)
  category!: ActionCategory;

  @IsArray()
  @IsEnum(ActionGroup, { each: true })
  group!: ActionGroup[];

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  iconColor?: string;

  @IsOptional()
  @IsString()
  documentationUrl?: string;

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
  credentialsSchema?: Record<string, any>;

  @IsOptional()
  @IsObject()
  operationSchema?: Record<string, any>;
}

export class UpdateActionRegistryDto {
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
  @IsEnum(ActionCategory)
  category?: ActionCategory;

  @IsOptional()
  @IsArray()
  @IsEnum(ActionGroup, { each: true })
  group?: ActionGroup[];

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  iconColor?: string;

  @IsOptional()
  @IsString()
  documentationUrl?: string;

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
  credentialsSchema?: Record<string, any>;

  @IsOptional()
  @IsObject()
  operationSchema?: Record<string, any>;
}

export class ActionRegistryResponseDto {
  key!: string;
  name!: string;
  displayName!: string;
  description?: string;
  category!: ActionCategory;
  group!: ActionGroup[];
  icon?: string;
  iconColor?: string;
  documentationUrl?: string;
  version!: number;
  isActive!: boolean;
  propertiesSchema!: Record<string, any>;
  credentialsSchema?: Record<string, any>;
  operationSchema?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
}
