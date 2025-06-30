export interface WorkflowContext {
  triggerData: any;
  variables?: Record<string, any>;
  workflowId?: string;
  runId?: string;
  userId?: string;
  tenantId?: string;
  triggerEventId?: string;
  triggerType?: 'webhook' | 'schedule' | 'manual' | 'database' | 'api';
  executionMode?: 'sync' | 'async' | 'test';
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  results?: any[];
  executionTime?: number;
  stepRunId?: string;
}

export interface StepExecutionContext {
  step: any; // WorkflowStepEntity
  context: WorkflowContext;
  runId: string;
  inputData?: any;
  retryCount?: number;
}

export interface FilterCondition {
  variable: string;
  operator: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date';
}

export interface TriggerFilter {
  combinator: 'AND' | 'OR';
  conditions: FilterCondition[];
}
