import { IBaseSchema } from './workflow.base';
import { IPropertyOption } from './workflow.property-schema';

export type FilterOperatorType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'dateTime'
  | 'any';

export type FilterOperator =
  // String operators
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'startsWith'
  | 'endsWith'
  | 'regex'
  | 'isEmpty'
  | 'isNotEmpty'
  // Number operators
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'notBetween'
  // Boolean operators
  | 'isTrue'
  | 'isFalse'
  // Date operators
  | 'after'
  | 'before'
  | 'afterOrEqual'
  | 'beforeOrEqual'
  | 'dateEquals'
  | 'dateNotEquals'
  | 'dateIsEmpty'
  // Array operators
  | 'arrayContains'
  | 'arrayNotContains'
  | 'arrayLength'
  // Object operators
  | 'exists'
  | 'notExists'
  | 'hasProperty'
  | 'notHasProperty';

export interface IFilterOperatorDefinition {
  type: FilterOperatorType;
  operation: FilterOperator;
  rightType?: FilterOperatorType;
  singleValue?: boolean;
  displayName: string;
  description?: string;
}

export interface IFilterCondition {
  id: string;
  leftValue: string; // Variable path like "{{variable.status}}"
  operator: IFilterOperatorDefinition;
  rightValue: any;
}

export interface IFilterValue {
  combinator: 'AND' | 'OR';
  conditions: IFilterCondition[];
  options?: {
    caseSensitive?: boolean;
    leftValue?: string;
    typeValidation?: 'strict' | 'loose';
    version?: 1 | 2;
  };
}

export interface IFilterField extends IBaseSchema {
  type: FilterOperatorType;
  path: string; // Variable path in payload
  operators: FilterOperator[];
  options?: IPropertyOption[]; // For options type fields
}

export type IFilterSchema = IFilterField[];
