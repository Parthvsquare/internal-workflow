import {
  IBaseSchema,
  IDisplayOptions,
  IValidationRule,
} from './workflow-base.interface';
import { IFilterValue } from './workflow-filter.interface';

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'multiOptions'
  | 'collection'
  | 'fixedCollection'
  | 'resourceLocator'
  | 'dateTime'
  | 'json'
  | 'hidden'
  | 'notice'
  | 'credentialsSelect'
  | 'filter'
  | 'assignmentCollection';

export interface IPropertyOption {
  name: string;
  value: string | number | boolean;
  description?: string;
  action?: string;
}

export interface ITypeOptions {
  // String options
  password?: boolean;
  rows?: number;
  editor?: 'codeNodeEditor' | 'jsEditor' | 'htmlEditor' | 'sqlEditor';

  // Options/MultiOptions
  loadOptionsMethod?: string;
  loadOptionsDependsOn?: string[];
  searchListMethod?: string;
  searchable?: boolean;

  // Number options
  minValue?: number;
  maxValue?: number;
  numberPrecision?: number;

  // Collection options
  multipleValues?: boolean;
  sortable?: boolean;

  // Resource Locator options
  resourceMapperMethod?: string;

  // Filter options
  caseSensitive?: boolean;
  allowedCombinators?: Array<'and' | 'or'>;
  maxConditions?: number;
}

export interface IResourceLocatorMode {
  displayName: string;
  name: string;
  type: 'list' | 'string' | 'id' | 'url';
  placeholder?: string;
  hint?: string;
  validation?: IValidationRule[];
  extractValue?: {
    type: 'regex';
    regex: string;
  };
  typeOptions?: ITypeOptions;
  url?: string;
}

export interface IBaseProperty extends IBaseSchema {
  type: PropertyType;
  displayOptions?: IDisplayOptions;
  typeOptions?: ITypeOptions;
  validation?: IValidationRule[];
  placeholder?: string;
  hint?: string;
  noDataExpression?: boolean;
}

export interface IStringProperty extends IBaseProperty {
  type: 'string';
  default: string;
}

export interface INumberProperty extends IBaseProperty {
  type: 'number';
  default: number;
}

export interface IBooleanProperty extends IBaseProperty {
  type: 'boolean';
  default: boolean;
}

export interface IOptionsProperty extends IBaseProperty {
  type: 'options';
  options: IPropertyOption[];
  default: string | number;
}

export interface IMultiOptionsProperty extends IBaseProperty {
  type: 'multiOptions';
  options: IPropertyOption[];
  default: (string | number)[];
}

export interface ICollectionProperty extends IBaseProperty {
  type: 'collection';
  options: INodeProperty[];
  default: Record<string, any>;
}

export interface IResourceLocatorProperty extends IBaseProperty {
  type: 'resourceLocator';
  modes: IResourceLocatorMode[];
  default: { mode: string; value: string };
}

export interface IDateTimeProperty extends IBaseProperty {
  type: 'dateTime';
  default: string;
}

export interface IJsonProperty extends IBaseProperty {
  type: 'json';
  default: string | object;
}

export interface IHiddenProperty extends IBaseProperty {
  type: 'hidden';
  default: any;
}

export interface INoticeProperty extends IBaseProperty {
  type: 'notice';
  default: string;
}

export interface ICredentialsSelectProperty extends IBaseProperty {
  type: 'credentialsSelect';
  credentialTypes: string[];
  default: string;
}

export interface IFilterProperty extends IBaseProperty {
  type: 'filter';
  default: IFilterValue;
}

export type INodeProperty =
  | IStringProperty
  | INumberProperty
  | IBooleanProperty
  | IOptionsProperty
  | IMultiOptionsProperty
  | ICollectionProperty
  | IResourceLocatorProperty
  | IDateTimeProperty
  | IJsonProperty
  | IHiddenProperty
  | INoticeProperty
  | ICredentialsSelectProperty
  | IFilterProperty;
