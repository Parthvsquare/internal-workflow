// Base interfaces for all schemas
export interface IBaseSchema {
  displayName: string;
  name: string;
  description?: string;
  required?: boolean;
  default?: any;
}

export interface IDisplayOptions {
  show?: Record<string, any[]>;
  hide?: Record<string, any[]>;
  hideOnCloud?: boolean;
}

export interface IValidationRule {
  type: 'regex' | 'length' | 'range' | 'custom';
  properties: Record<string, any>;
  errorMessage?: string;
}
