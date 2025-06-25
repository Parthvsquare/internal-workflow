import moment from 'moment';
import { FILTER_OPERATORS } from '../constant/workflow';
import { ValidationResult } from '../dto/workflow.filter';
import {
  FilterOperator,
  FilterOperatorType,
  IFilterCondition,
  IFilterField,
  IFilterOperatorDefinition,
  IFilterValue,
} from '../interface/workflow.filter';
import { IPropertyOption } from '../interface/workflow.property-schema';

export class FilterField implements IFilterField {
  displayName!: string;
  name!: string;
  description?: string;
  required?: boolean;
  default?: any;
  type!: FilterOperatorType;
  path!: string;
  operators!: FilterOperator[];
  options?: IPropertyOption[];

  constructor(config: IFilterField) {
    Object.assign(this, config);
  }

  validate(condition: IFilterCondition): ValidationResult {
    // Validate operator is supported
    if (!this.operators.includes(condition.operator.operation)) {
      return {
        isValid: false,
        error: `Operator ${condition.operator.operation} is not supported for ${this.displayName}`,
      };
    }

    // Validate right value based on operator and type
    return this.validateRightValue(condition.rightValue, condition.operator);
  }

  private validateRightValue(
    value: any,
    operator: IFilterOperatorDefinition
  ): ValidationResult {
    switch (this.type) {
      case 'string':
        if (
          typeof value !== 'string' &&
          value !== null &&
          value !== undefined
        ) {
          return { isValid: false, error: 'Value must be a string' };
        }
        break;
      case 'number':
        if (
          typeof value !== 'number' &&
          value !== null &&
          value !== undefined
        ) {
          return { isValid: false, error: 'Value must be a number' };
        }
        break;
      case 'boolean':
        if (
          typeof value !== 'boolean' &&
          value !== null &&
          value !== undefined
        ) {
          return { isValid: false, error: 'Value must be a boolean' };
        }
        break;
      case 'dateTime':
        if (value && !moment(value).isValid()) {
          return { isValid: false, error: 'Value must be a valid date' };
        }
        break;
    }

    return { isValid: true };
  }

  getAvailableOperators(): IFilterOperatorDefinition[] {
    return FILTER_OPERATORS.filter(
      (op) =>
        this.operators.includes(op.operation) &&
        (op.type === this.type || op.type === 'any')
    );
  }
}

export class FilterSchema {
  fields: FilterField[];

  constructor(fields: IFilterField[]) {
    this.fields = fields.map((field) => new FilterField(field));
  }

  validate(filterValue: IFilterValue): ValidationResult {
    if (!filterValue.conditions || filterValue.conditions.length === 0) {
      return { isValid: false, error: 'At least one condition is required' };
    }

    for (const condition of filterValue.conditions) {
      const field = this.getFieldByPath(condition.leftValue);
      if (!field) {
        return {
          isValid: false,
          error: `Unknown field: ${condition.leftValue}`,
        };
      }

      const result = field.validate(condition);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }

  getFieldByPath(path: string): FilterField | undefined {
    // Remove {{variable.}} wrapper and find field
    const cleanPath = path.replace(/^\{\{variable\./, '').replace(/\}\}$/, '');
    return this.fields.find((field) => field.path === cleanPath);
  }

  getFieldByName(name: string): FilterField | undefined {
    return this.fields.find((field) => field.name === name);
  }
}
