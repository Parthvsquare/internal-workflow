import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import * as workflowPropertySchema from '../interface/workflow.property-schema';
import * as workflowFilter from '../interface/workflow.filter';

export class ValidationResult {
  isValid!: boolean;
  error?: string;
}

export class DisplayOptionsDto {
  @IsOptional()
  @IsObject()
  show?: Record<string, any[]>;

  @IsOptional()
  @IsObject()
  hide?: Record<string, any[]>;

  @IsOptional()
  @IsBoolean()
  hideOnCloud?: boolean;
}

export class ValidationRuleDto {
  @IsEnum(['regex', 'length', 'range', 'custom'])
  type!: string;

  @IsObject()
  properties!: Record<string, any>;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class PropertyOptionDto {
  @IsString()
  name!: string;

  value!: string | number | boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  action?: string;
}

export class TypeOptionsDto {
  @IsOptional()
  @IsBoolean()
  password?: boolean;

  @IsOptional()
  rows?: number;

  @IsOptional()
  @IsString()
  editor?: string;

  @IsOptional()
  @IsString()
  loadOptionsMethod?: string;

  @IsOptional()
  @IsArray()
  loadOptionsDependsOn?: string[];

  @IsOptional()
  @IsString()
  searchListMethod?: string;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  minValue?: number;

  @IsOptional()
  maxValue?: number;

  @IsOptional()
  numberPrecision?: number;

  @IsOptional()
  @IsBoolean()
  multipleValues?: boolean;

  @IsOptional()
  @IsBoolean()
  sortable?: boolean;
}

export class BasePropertyDto {
  @IsString()
  displayName!: string;

  @IsString()
  name!: string;

  @IsEnum([
    'string',
    'number',
    'boolean',
    'options',
    'multiOptions',
    'collection',
    'resourceLocator',
    'dateTime',
    'json',
    'hidden',
    'notice',
    'credentialsSelect',
    'filter',
  ])
  type!: workflowPropertySchema.PropertyType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  default?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => DisplayOptionsDto)
  displayOptions?: DisplayOptionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeOptionsDto)
  typeOptions?: TypeOptionsDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  validation?: ValidationRuleDto[];

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  hint?: string;

  @IsOptional()
  @IsBoolean()
  noDataExpression?: boolean;
}

export class StringPropertyDto extends BasePropertyDto {
  override type = 'string' as const;

  @IsString()
  override default!: string;
}

export class NumberPropertyDto extends BasePropertyDto {
  override type = 'number' as const;

  @IsNumber()
  override default!: number;
}

export class OptionsPropertyDto extends BasePropertyDto {
  override type = 'options' as const;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyOptionDto)
  options!: PropertyOptionDto[];

  @IsString()
  @IsOptional()
  override default!: string | number;
}

export class ResourceLocatorModeDto {
  @IsString()
  displayName!: string;

  @IsString()
  name!: string;

  @IsEnum(['list', 'string', 'id', 'url'])
  type!: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  validation?: ValidationRuleDto[];

  @IsOptional()
  @IsObject()
  extractValue?: { type: 'regex'; regex: string };
}

export class ResourceLocatorPropertyDto extends BasePropertyDto {
  override type = 'resourceLocator' as const;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceLocatorModeDto)
  modes!: ResourceLocatorModeDto[];

  @IsObject()
  override default!: { mode: string; value: string };
}

export class FilterConditionDto {
  @IsString()
  id!: string;

  @IsString()
  leftValue!: string;

  @IsObject()
  operator: any; // IFilterOperatorDefinition

  rightValue: any;
}

export class FilterValueDto {
  @IsEnum(['AND', 'OR'])
  combinator!: 'AND' | 'OR';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  conditions?: FilterConditionDto[];

  @IsOptional()
  @IsObject()
  options?: {
    caseSensitive?: boolean;
    leftValue?: string;
    typeValidation?: 'strict' | 'loose';
    version?: 1 | 2;
  };
}

export class FilterFieldDto {
  @IsString()
  displayName?: string;

  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['string', 'number', 'boolean', 'array', 'object', 'dateTime', 'any'])
  type!: workflowFilter.FilterOperatorType;

  @IsString()
  path?: string;

  @IsArray()
  @IsString({ each: true })
  operators?: workflowFilter.FilterOperator[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyOptionDto)
  options?: PropertyOptionDto[];
}

export class PropertySchemaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BasePropertyDto, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: StringPropertyDto, name: 'string' },
        { value: NumberPropertyDto, name: 'number' },
        { value: OptionsPropertyDto, name: 'options' },
        { value: ResourceLocatorPropertyDto, name: 'resourceLocator' },
      ],
    },
  })
  properties!: BasePropertyDto[];

  @IsOptional()
  @IsObject()
  methods?: {
    listSearch?: Record<string, string>;
    loadOptions?: Record<string, string>;
  };
}

export class FilterSchemaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterFieldDto)
  fields!: FilterFieldDto[];
}
