import { ValidationResult } from '../dto/workflow.filter';
import { PropertyFactory } from '../factory/workflow.property';
import { IDisplayOptions, IValidationRule } from '../interface/workflow.base';
import { IFilterValue } from '../interface/workflow.filter';
import {
  IBaseProperty,
  IBooleanProperty,
  ICollectionProperty,
  ICredentialsSelectProperty,
  IDateTimeProperty,
  IFilterProperty,
  IHiddenProperty,
  IJsonProperty,
  IMultiOptionsProperty,
  INodeProperty,
  INoticeProperty,
  INumberProperty,
  IOptionsProperty,
  IPropertyOption,
  IResourceLocatorMode,
  IResourceLocatorProperty,
  IStringProperty,
  ITypeOptions,
  PropertyType,
} from '../interface/workflow.property-schema';

export abstract class BaseProperty implements IBaseProperty {
  displayName!: string;
  name!: string;
  type!: PropertyType;
  description?: string;
  required?: boolean;
  default?: any;
  displayOptions?: IDisplayOptions;
  typeOptions?: ITypeOptions;
  validation?: IValidationRule[];
  placeholder?: string;
  hint?: string;
  noDataExpression?: boolean;

  constructor(config: Partial<IBaseProperty>) {
    Object.assign(this, config);
  }

  abstract validate(value: any): ValidationResult;

  isVisible(currentValues: Record<string, any>): boolean {
    if (!this.displayOptions) return true;

    const { show, hide } = this.displayOptions;

    if (show) {
      const shouldShow = Object.entries(show).every(([key, values]) =>
        values.includes(currentValues[key])
      );
      if (!shouldShow) return false;
    }

    if (hide) {
      const shouldHide = Object.entries(hide).some(([key, values]) =>
        values.includes(currentValues[key])
      );
      if (shouldHide) return false;
    }

    return true;
  }
}

export class StringProperty extends BaseProperty implements IStringProperty {
  override type = 'string' as const;
  override default: string;

  constructor(config: Omit<IStringProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (!value || value === '')) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value !== undefined && typeof value !== 'string') {
      return { isValid: false, error: `${this.displayName} must be a string` };
    }

    // Apply validation rules
    if (this.validation) {
      for (const rule of this.validation) {
        const result = this.validateRule(value, rule);
        if (!result.isValid) return result;
      }
    }

    return { isValid: true };
  }

  private validateRule(value: string, rule: IValidationRule): ValidationResult {
    switch (rule.type) {
      case 'regex': {
        const regex = new RegExp(rule.properties.regex);
        if (!regex.test(value)) {
          return {
            isValid: false,
            error: rule.errorMessage || `${this.displayName} format is invalid`,
          };
        }
        break;
      }
      case 'length':
        if (rule.properties.min && value.length < rule.properties.min) {
          return {
            isValid: false,
            error: `${this.displayName} must be at least ${rule.properties.min} characters`,
          };
        }
        if (rule.properties.max && value.length > rule.properties.max) {
          return {
            isValid: false,
            error: `${this.displayName} must be no more than ${rule.properties.max} characters`,
          };
        }
        break;
    }
    return { isValid: true };
  }
}

export class NumberProperty extends BaseProperty implements INumberProperty {
  override type = 'number' as const;
  override default: number;

  constructor(config: Omit<INumberProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (value === undefined || value === null)) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value !== undefined && typeof value !== 'number') {
      return { isValid: false, error: `${this.displayName} must be a number` };
    }

    if (
      this.typeOptions?.minValue !== undefined &&
      value < this.typeOptions.minValue
    ) {
      return {
        isValid: false,
        error: `${this.displayName} must be at least ${this.typeOptions.minValue}`,
      };
    }

    if (
      this.typeOptions?.maxValue !== undefined &&
      value > this.typeOptions.maxValue
    ) {
      return {
        isValid: false,
        error: `${this.displayName} must be no more than ${this.typeOptions.maxValue}`,
      };
    }

    return { isValid: true };
  }
}

export class OptionsProperty extends BaseProperty implements IOptionsProperty {
  override type = 'options' as const;
  options: IPropertyOption[];
  override default: string | number;

  constructor(config: Omit<IOptionsProperty, 'type'>) {
    super(config);
    this.options = config.options;
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (
      this.required &&
      (value === undefined || value === null || value === '')
    ) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value !== undefined) {
      const validValues = this.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        return {
          isValid: false,
          error: `${this.displayName} must be one of: ${validValues.join(
            ', '
          )}`,
        };
      }
    }

    return { isValid: true };
  }

  getOptionByValue(value: string | number): IPropertyOption | undefined {
    return this.options.find((opt) => opt.value === value);
  }
}

export class ResourceLocatorProperty
  extends BaseProperty
  implements IResourceLocatorProperty
{
  override type = 'resourceLocator' as const;
  modes: IResourceLocatorMode[];
  override default: { mode: string; value: string };

  constructor(config: Omit<IResourceLocatorProperty, 'type'>) {
    super(config);
    this.modes = config.modes;
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (!value || !value.mode || !value.value)) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value) {
      const mode = this.modes.find((m) => m.name === value.mode);
      if (!mode) {
        return {
          isValid: false,
          error: `Invalid mode for ${this.displayName}`,
        };
      }

      // Validate based on mode
      if (mode.validation) {
        for (const rule of mode.validation) {
          if (rule.type === 'regex') {
            const regex = new RegExp(rule.properties.regex);
            if (!regex.test(value.value)) {
              return {
                isValid: false,
                error:
                  rule.errorMessage || `${this.displayName} format is invalid`,
              };
            }
          }
        }
      }
    }

    return { isValid: true };
  }

  getModeByName(name: string): IResourceLocatorMode | undefined {
    return this.modes.find((mode) => mode.name === name);
  }
}

export class CollectionProperty
  extends BaseProperty
  implements ICollectionProperty
{
  override type = 'collection' as const;
  options: INodeProperty[];
  override default: Record<string, any>;

  constructor(config: Omit<ICollectionProperty, 'type'>) {
    super(config);
    this.options = config.options;
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (!value || Object.keys(value).length === 0)) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value && typeof value === 'object') {
      // Validate each property in the collection
      for (const [key, val] of Object.entries(value)) {
        const property = this.options.find((opt) => opt.name === key);
        if (property) {
          const propertyInstance = PropertyFactory.create(property);
          const result = propertyInstance.validate(val);
          if (!result.isValid) {
            return result;
          }
        }
      }
    }

    return { isValid: true };
  }
}

export class BooleanProperty extends BaseProperty implements IBooleanProperty {
  override type = 'boolean' as const;
  override default: boolean;

  constructor(config: Omit<IBooleanProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (value === undefined || value === null)) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value !== undefined && typeof value !== 'boolean') {
      return { isValid: false, error: `${this.displayName} must be a boolean` };
    }

    return { isValid: true };
  }
}

export class MultiOptionsProperty
  extends BaseProperty
  implements IMultiOptionsProperty
{
  override type = 'multiOptions' as const;
  options: IPropertyOption[];
  override default: (string | number)[];

  constructor(config: Omit<IMultiOptionsProperty, 'type'>) {
    super(config);
    this.options = config.options;
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (
      this.required &&
      (!value || !Array.isArray(value) || value.length === 0)
    ) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value && Array.isArray(value)) {
      const validValues = this.options.map((opt) => opt.value);
      const invalidValues = value.filter((val) => !validValues.includes(val));

      if (invalidValues.length > 0) {
        return {
          isValid: false,
          error: `${
            this.displayName
          } contains invalid values: ${invalidValues.join(', ')}`,
        };
      }
    }

    return { isValid: true };
  }

  getOptionsByValues(values: (string | number)[]): IPropertyOption[] {
    return this.options.filter((opt) =>
      values.includes(opt.value as string | number)
    );
  }
}

export class DateTimeProperty
  extends BaseProperty
  implements IDateTimeProperty
{
  override type = 'dateTime' as const;
  override default: string;

  constructor(config: Omit<IDateTimeProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (!value || value === '')) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value && typeof value === 'string') {
      // Validate if it's a valid date string
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          isValid: false,
          error: `${this.displayName} must be a valid date`,
        };
      }
    } else if (value !== undefined && value !== null) {
      return {
        isValid: false,
        error: `${this.displayName} must be a date string`,
      };
    }

    return { isValid: true };
  }
}

export class JsonProperty extends BaseProperty implements IJsonProperty {
  override type = 'json' as const;
  override default: string | object;

  constructor(config: Omit<IJsonProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (!value || value === '')) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value && typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch (error) {
        return {
          isValid: false,
          error: `${this.displayName} must be valid JSON`,
        };
      }
    } else if (
      value !== undefined &&
      value !== null &&
      typeof value !== 'object'
    ) {
      return {
        isValid: false,
        error: `${this.displayName} must be a JSON string or object`,
      };
    }

    return { isValid: true };
  }

  getParsedValue(value: string | object): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }
}

export class HiddenProperty extends BaseProperty implements IHiddenProperty {
  override type = 'hidden' as const;
  override default: any;

  constructor(config: Omit<IHiddenProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    // Hidden properties typically don't need validation
    // They're used for storing internal values
    return { isValid: true };
  }
}

export class NoticeProperty extends BaseProperty implements INoticeProperty {
  override type = 'notice' as const;
  override default: string;

  constructor(config: Omit<INoticeProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    // Notice properties are just for display, no validation needed
    return { isValid: true };
  }
}

export class CredentialsSelectProperty
  extends BaseProperty
  implements ICredentialsSelectProperty
{
  override type = 'credentialsSelect' as const;
  credentialTypes: string[];
  override default: string;

  constructor(config: Omit<ICredentialsSelectProperty, 'type'>) {
    super(config);
    this.credentialTypes = config.credentialTypes;
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (this.required && (!value || value === '')) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value && typeof value !== 'string') {
      return {
        isValid: false,
        error: `${this.displayName} must be a credential ID`,
      };
    }

    return { isValid: true };
  }

  isSupportedCredentialType(credentialType: string): boolean {
    return this.credentialTypes.includes(credentialType);
  }
}

export class FilterProperty extends BaseProperty implements IFilterProperty {
  override type = 'filter' as const;
  override default: IFilterValue;

  constructor(config: Omit<IFilterProperty, 'type'>) {
    super(config);
    this.default = config.default;
  }

  validate(value: any): ValidationResult {
    if (
      this.required &&
      (!value || !value.conditions || value.conditions.length === 0)
    ) {
      return { isValid: false, error: `${this.displayName} is required` };
    }

    if (value && typeof value === 'object') {
      // Validate filter structure
      if (!value.combinator || !['AND', 'OR'].includes(value.combinator)) {
        return {
          isValid: false,
          error: `${this.displayName} must have a valid combinator (AND or OR)`,
        };
      }

      if (value.conditions && Array.isArray(value.conditions)) {
        for (const condition of value.conditions) {
          if (!condition.leftValue || !condition.operator) {
            return {
              isValid: false,
              error: `${this.displayName} conditions must have leftValue and operator`,
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  evaluateFilter(value: IFilterValue, data: any): boolean {
    if (!value || !value.conditions || value.conditions.length === 0) {
      return true; // No filter means pass through
    }

    const results = value.conditions.map((condition) => {
      const leftValue = this.resolveValue(condition.leftValue, data);
      const rightValue = condition.rightValue;

      return this.evaluateCondition(leftValue, condition.operator, rightValue);
    });

    return value.combinator === 'AND'
      ? results.every((result) => result)
      : results.some((result) => result);
  }

  private resolveValue(expression: string, data: any): any {
    // Simple variable resolution - in a real implementation, this would be more sophisticated
    if (expression.startsWith('{{') && expression.endsWith('}}')) {
      const path = expression.slice(2, -2).replace('variable.', '');
      return path.split('.').reduce((obj, key) => obj?.[key], data);
    }
    return expression;
  }

  private evaluateCondition(
    leftValue: any,
    operator: any,
    rightValue: any
  ): boolean {
    switch (operator.type) {
      case 'string':
        return this.evaluateStringCondition(
          leftValue,
          operator.operation,
          rightValue
        );
      case 'number':
        return this.evaluateNumberCondition(
          leftValue,
          operator.operation,
          rightValue
        );
      case 'boolean':
        return this.evaluateBooleanCondition(
          leftValue,
          operator.operation,
          rightValue
        );
      default:
        return false;
    }
  }

  private evaluateStringCondition(
    left: any,
    operation: string,
    right: any
  ): boolean {
    const leftStr = String(left || '');
    const rightStr = String(right || '');

    switch (operation) {
      case 'equals':
        return leftStr === rightStr;
      case 'notEquals':
        return leftStr !== rightStr;
      case 'contains':
        return leftStr.includes(rightStr);
      case 'notContains':
        return !leftStr.includes(rightStr);
      case 'startsWith':
        return leftStr.startsWith(rightStr);
      case 'endsWith':
        return leftStr.endsWith(rightStr);
      case 'regex':
        try {
          return new RegExp(rightStr).test(leftStr);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private evaluateNumberCondition(
    left: any,
    operation: string,
    right: any
  ): boolean {
    const leftNum = Number(left);
    const rightNum = Number(right);

    if (isNaN(leftNum) || isNaN(rightNum)) return false;

    switch (operation) {
      case 'equals':
        return leftNum === rightNum;
      case 'notEquals':
        return leftNum !== rightNum;
      case 'gt':
        return leftNum > rightNum;
      case 'gte':
        return leftNum >= rightNum;
      case 'lt':
        return leftNum < rightNum;
      case 'lte':
        return leftNum <= rightNum;
      default:
        return false;
    }
  }

  private evaluateBooleanCondition(
    left: any,
    operation: string,
    right: any
  ): boolean {
    const leftBool = Boolean(left);
    const rightBool = Boolean(right);

    switch (operation) {
      case 'equals':
        return leftBool === rightBool;
      case 'notEquals':
        return leftBool !== rightBool;
      default:
        return false;
    }
  }
}
