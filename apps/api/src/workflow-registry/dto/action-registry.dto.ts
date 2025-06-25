import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'Unique key for the action',
    example: 'send_email',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    description: 'Internal name of the action',
    example: 'sendEmail',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Display name shown in UI',
    example: 'Send Email',
  })
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Action description',
    example: 'Send email notification to users',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ActionCategory,
    description: 'Action category',
    example: ActionCategory.COMMUNICATION,
  })
  @IsEnum(ActionCategory)
  category!: ActionCategory;

  @ApiProperty({
    enum: ActionGroup,
    isArray: true,
    description: 'Action groups',
    example: [ActionGroup.ACTION],
  })
  @IsArray()
  @IsEnum(ActionGroup, { each: true })
  group!: ActionGroup[];

  @ApiPropertyOptional({
    description: 'Icon identifier',
    example: 'fa:envelope',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Icon color',
    example: '#007bff',
  })
  @IsOptional()
  @IsString()
  iconColor?: string;

  @ApiPropertyOptional({
    description: 'Documentation URL',
    example: 'https://docs.example.com/actions/send-email',
  })
  @IsOptional()
  @IsString()
  documentationUrl?: string;

  @ApiPropertyOptional({
    description: 'Action version',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({
    description: 'Whether action is active',
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
          displayName: 'To',
          name: 'to',
          type: 'string',
          required: true,
        },
      ],
    },
  })
  @IsObject()
  propertiesSchema!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Required credentials schema',
    example: {
      required: ['emailApi'],
      optional: [],
    },
  })
  @IsOptional()
  @IsObject()
  credentialsSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available operations schema',
    example: {
      email: {
        operations: ['send', 'template'],
        displayName: 'Email',
      },
    },
  })
  @IsOptional()
  @IsObject()
  operationSchema?: Record<string, any>;
}

export class UpdateActionRegistryDto {
  @ApiPropertyOptional({
    description: 'Internal name of the action',
    example: 'sendEmail',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Display name shown in UI',
    example: 'Send Email',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Action description',
    example: 'Send email notification to users',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ActionCategory,
    description: 'Action category',
    example: ActionCategory.COMMUNICATION,
  })
  @IsOptional()
  @IsEnum(ActionCategory)
  category?: ActionCategory;

  @ApiPropertyOptional({
    enum: ActionGroup,
    isArray: true,
    description: 'Action groups',
    example: [ActionGroup.ACTION],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ActionGroup, { each: true })
  group?: ActionGroup[];

  @ApiPropertyOptional({
    description: 'Icon identifier',
    example: 'fa:envelope',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Icon color',
    example: '#007bff',
  })
  @IsOptional()
  @IsString()
  iconColor?: string;

  @ApiPropertyOptional({
    description: 'Documentation URL',
    example: 'https://docs.example.com/actions/send-email',
  })
  @IsOptional()
  @IsString()
  documentationUrl?: string;

  @ApiPropertyOptional({
    description: 'Action version',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional({
    description: 'Whether action is active',
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
          displayName: 'To',
          name: 'to',
          type: 'string',
          required: true,
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  propertiesSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Required credentials schema',
    example: {
      required: ['emailApi'],
      optional: [],
    },
  })
  @IsOptional()
  @IsObject()
  credentialsSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Available operations schema',
    example: {
      email: {
        operations: ['send', 'template'],
        displayName: 'Email',
      },
    },
  })
  @IsOptional()
  @IsObject()
  operationSchema?: Record<string, any>;
}

export class ActionRegistryResponseDto {
  @ApiProperty({ description: 'Unique action key', example: 'send_email' })
  key!: string;

  @ApiProperty({ description: 'Action name', example: 'sendEmail' })
  name!: string;

  @ApiProperty({ description: 'Display name', example: 'Send Email' })
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Action description',
    example: 'Send email notification to users',
  })
  description?: string;

  @ApiProperty({
    enum: ActionCategory,
    description: 'Action category',
    example: ActionCategory.COMMUNICATION,
  })
  category!: ActionCategory;

  @ApiProperty({
    enum: ActionGroup,
    isArray: true,
    description: 'Action groups',
    example: [ActionGroup.ACTION],
  })
  group!: ActionGroup[];

  @ApiPropertyOptional({
    description: 'Icon identifier',
    example: 'fa:envelope',
  })
  icon?: string;

  @ApiPropertyOptional({ description: 'Icon color', example: '#007bff' })
  iconColor?: string;

  @ApiPropertyOptional({
    description: 'Documentation URL',
    example: 'https://docs.example.com/actions/send-email',
  })
  documentationUrl?: string;

  @ApiProperty({ description: 'Action version', example: 1 })
  version!: number;

  @ApiProperty({ description: 'Whether action is active', example: true })
  isActive!: boolean;

  @ApiProperty({
    description: 'Properties schema',
    example: {
      properties: [
        {
          displayName: 'To',
          name: 'to',
          type: 'string',
          required: true,
        },
      ],
    },
  })
  propertiesSchema!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Credentials schema',
    example: {
      required: ['emailApi'],
      optional: [],
    },
  })
  credentialsSchema?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Operation schema',
    example: {
      email: {
        operations: ['send', 'template'],
        displayName: 'Email',
      },
    },
  })
  operationSchema?: Record<string, any>;

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
