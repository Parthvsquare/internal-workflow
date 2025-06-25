import { IFilterOperatorDefinition } from '../interface/workflow.filter';

export const FILTER_OPERATORS: IFilterOperatorDefinition[] = [
  // String operators
  {
    type: 'string',
    operation: 'equals',
    displayName: 'Equals',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'not_equals',
    displayName: 'Not equals',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'contains',
    displayName: 'Contains',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'not_contains',
    displayName: 'Does not contain',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'startsWith',
    displayName: 'Starts with',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'endsWith',
    displayName: 'Ends with',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'regex',
    displayName: 'Matches regex',
    singleValue: true,
  },
  {
    type: 'string',
    operation: 'isEmpty',
    displayName: 'Is empty',
    singleValue: false,
  },
  {
    type: 'string',
    operation: 'isNotEmpty',
    displayName: 'Is not empty',
    singleValue: false,
  },

  // Number operators
  {
    type: 'number',
    operation: 'equals',
    displayName: 'Equals',
    singleValue: true,
  },
  {
    type: 'number',
    operation: 'not_equals',
    displayName: 'Not equals',
    singleValue: true,
  },
  {
    type: 'number',
    operation: 'greaterThan',
    displayName: 'Greater than',
    singleValue: true,
  },
  {
    type: 'number',
    operation: 'lessThan',
    displayName: 'Less than',
    singleValue: true,
  },
  {
    type: 'number',
    operation: 'greaterThanOrEqual',
    displayName: 'Greater than or equal',
    singleValue: true,
  },
  {
    type: 'number',
    operation: 'lessThanOrEqual',
    displayName: 'Less than or equal',
    singleValue: true,
  },
  {
    type: 'number',
    operation: 'between',
    displayName: 'Between',
    singleValue: false,
  },

  // Boolean operators
  {
    type: 'boolean',
    operation: 'isTrue',
    displayName: 'Is true',
    singleValue: false,
  },
  {
    type: 'boolean',
    operation: 'isFalse',
    displayName: 'Is false',
    singleValue: false,
  },

  // Date operators
  {
    type: 'dateTime',
    operation: 'after',
    displayName: 'After',
    singleValue: true,
  },
  {
    type: 'dateTime',
    operation: 'before',
    displayName: 'Before',
    singleValue: true,
  },
  {
    type: 'dateTime',
    operation: 'dateEquals',
    displayName: 'Equals',
    singleValue: true,
  },
  {
    type: 'dateTime',
    operation: 'between',
    displayName: 'Between',
    singleValue: false,
  },

  // Universal operators
  {
    type: 'any',
    operation: 'exists',
    displayName: 'Exists',
    singleValue: false,
  },
  {
    type: 'any',
    operation: 'notExists',
    displayName: 'Does not exist',
    singleValue: false,
  },
];
