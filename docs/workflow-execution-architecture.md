# Workflow Execution Architecture Documentation

## Overview

This document describes the complete workflow execution system built with NestJS and TypeORM in an Nx monorepo. The system follows an n8n-inspired registry-driven architecture where actions and triggers are dynamically registered and executed.

## 🏗️ System Architecture

### Core Components

1. **Registry System** - Dynamic action and trigger definitions
2. **Execution Engine** - Orchestrates workflow runs
3. **Action Executor** - Executes individual workflow steps
4. **Trigger Processor** - Processes incoming trigger events
5. **Filter Engine** - Evaluates trigger conditions
6. **Subscription Manager** - Links workflows to triggers

## 📊 Entity Architecture (14 Entities)

### Core Workflow Entities (6)

#### **WorkflowDefinitionEntity**

Main workflow container that appears in the UI

```typescript
{
  id: UUID,
  name: string,
  description?: string,
  segment?: 'CRM' | 'SALES' | 'MARKETING',
  category?: string, // 'automation', 'integration', 'notification'
  tags?: string[], // User-defined organization tags
  latest_ver_id?: UUID, // Points to current version
  is_active: boolean,
  is_template: boolean, // Template workflows for quick setup
  pinned: boolean, // User favorites
  created_by?: DATE,
  updated_by?: DATE
}
```

#### **WorkflowVersionEntity**

Immutable versions with S3 storage support

```typescript
{
  id: UUID,
  workflow_id: UUID,
  version_num: number,
  s3_key: string, // e.g., s3://wf/<id>/v2.json
  s3_etag?: string,
  inline_json?: object, // NULL => fetch from S3
  root_step_id?: UUID,
  editor_id?: UUID
}
```

#### **WorkflowStepEntity**

Individual workflow steps with n8n-style configuration

```typescript
{
  id: UUID,
  version_id: UUID,
  kind: string, // 'action', 'trigger', 'condition', 'delay'
  action_key?: string, // References ActionRegistry
  cfg?: object, // Step configuration
  name?: string,
  credential_id?: UUID, // For external API calls
  resource?: string, // For resource/operation pattern
  operation?: string,
  display_options?: object // Show/hide conditions
}
```

#### **WorkflowEdgeEntity**

Connects steps in the workflow graph

```typescript
{
  from_step_id: UUID,
  branch_key: string, // 'default', 'true', 'false', etc.
  to_step_id?: UUID
}
```

#### **WorkflowRunEntity** (Enhanced with Metrics)

Runtime execution tracking with consolidated metrics

```typescript
{
  id: UUID,
  workflow_id: UUID,
  version_id: UUID,
  trigger_event_id?: string,
  trigger_type?: 'webhook' | 'schedule' | 'manual' | 'database',
  trigger_summary?: object, // Quick access trigger data
  execution_mode: 'sync' | 'async' | 'test',
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED',

  // Step counters
  total_steps: number,
  completed_steps: number,
  failed_steps: number,
  skipped_steps: number,

  // Execution metrics (consolidated from removed ExecutionMetricsEntity)
  execution_time?: number, // Total time in ms
  queue_time?: number, // Time in queue before execution
  memory_usage?: number, // Peak memory in MB
  cpu_time?: number, // CPU time in ms
  network_calls: number, // External API calls count
  network_time: number, // Network time in ms
  cache_hits: number,
  cache_misses: number,
  error_count: number,
  warning_count: number,

  // Retry logic
  retry_count: number,
  max_retries: number,

  // Timing
  started_at?: Date,
  ended_at?: Date,
  fail_reason?: string,
  context_data?: object,
  created_by?: UUID,

  // Computed properties
  get success_rate(): number, // Percentage of successful steps
  get cache_hit_rate(): number // Cache hit percentage
}
```

#### **StepRunEntity**

Individual step execution tracking

```typescript
{
  run_id: UUID, // Composite PK
  step_id: UUID, // Composite PK
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED',
  started_at?: Date,
  ended_at?: Date,
  execution_time?: number,
  result_data?: object,
  error_message?: string,
  error_stack?: string,
  retry_count: number,
  max_retries: number,
  input_data?: object, // For debugging
  output_data?: object, // For next steps
  idempotency_key?: string
}
```

### Registry System Entities (3)

#### **WorkflowActionRegistryEntity**

Dynamic action definitions (n8n-style)

```typescript
{
  id: UUID,
  key: string, // Unique identifier (e.g., 'google_drive', 'sms_send')
  name: string,
  display_name?: string,
  description?: string,
  category?: string, // 'internal', 'external', 'communication'
  group: string[], // ['action', 'trigger']
  icon?: string,
  icon_color?: string,
  documentation_url?: string,
  execution_type?: 'internal_function' | 'external_api' | 'conditional',
  version: number,
  is_active: boolean,

  // n8n-style schemas
  properties_schema?: object, // Node properties definition
  credentials_schema?: object, // Required credentials
  operation_schema?: object, // Available operations
  filter_schema?: object,
  sample_payload?: object,
  methods?: object // loadOptions, etc.
}
```

#### **WorkflowTriggerRegistryEntity**

Dynamic trigger definitions

```typescript
{
  id: UUID,
  key: string, // Unique identifier
  name: string,
  display_name?: string,
  description?: string,
  category?: string, // 'webhook', 'database', 'schedule'
  event_source?: 'webhook' | 'debezium' | 'poll' | 'manual',
  version: number,
  is_active: boolean,

  // Trigger-specific schemas
  properties_schema: object,
  filter_schema: object, // Available filter conditions
  sample_payload: object,
  webhook_config?: object, // Webhook-specific config
  available_variables: object // Variables for filtering
}
```

#### **WorkflowSubscriptionEntity**

Links workflows to triggers with filter conditions

```typescript
{
  id: UUID,
  workflow_id: UUID,
  trigger_key: string, // References TriggerRegistry
  filter_conditions?: object, // User-defined filter conditions
  is_active: boolean
}
```

### Configuration Entities (3)

#### **WorkflowVariableEntity**

Workflow-specific variables

```typescript
{
  id: UUID,
  workflow_id: UUID,
  key: string,
  value?: any,
  data_type: 'string' | 'number' | 'boolean' | 'object' | 'array',
  is_encrypted: boolean,
  is_secret: boolean, // Hidden in UI
  description?: string,
  default_value?: any,
  created_by?: UUID
}
```

#### **WorkflowCredentialTypeEntity** & **WorkflowUserCredentialEntity**

Credential management for external API calls

```typescript
// Credential type definitions
WorkflowCredentialTypeEntity {
  id: UUID,
  name: string,
  display_name: string,
  description?: string,
  icon?: string,
  properties_schema: object, // Field definitions
  test_endpoint?: object, // How to test credentials
  auth_type?: 'oauth2' | 'api_key' | 'basic' | 'custom',
  supported_actions?: string[]
}

// User credential instances
WorkflowUserCredentialEntity {
  id: UUID,
  user_id: UUID,
  credential_type: string,
  name: string,
  encrypted_data: string, // Encrypted credential data
  is_active: boolean
}
```

### Trigger Management Entities (2)

#### **ScheduleTriggerEntity**

Cron/schedule trigger management

```typescript
{
  id: UUID,
  workflow_id: UUID,
  name: string,
  cron_expression: string,
  timezone: string,
  is_active: boolean,
  last_execution?: Date,
  next_execution?: Date,
  execution_count: number,
  max_executions?: number,
  execution_data?: object,
  created_by?: UUID
}
```

#### **WebhookEndpointEntity**

Webhook endpoint management

```typescript
{
  id: UUID,
  workflow_id: UUID,
  trigger_key: string,
  endpoint_path: string, // e.g., '/webhook/abc123def'
  method: string, // HTTP method
  auth_required: boolean,
  auth_header?: string,
  auth_token?: string, // Encrypted
  response_mode: 'sync' | 'async' | 'webhook',
  response_data?: object,
  is_active: boolean,
  last_triggered?: Date,
  total_calls: number
}
```

## 🔄 Execution Flow

### 1. Trigger Event Processing

```typescript
// Entry point for all trigger events
WorkflowEngineService.processTriggerEvent(triggerKey, eventData, context);
```

**Flow:**

1. **Lookup Trigger Registry** - Find trigger definition by key
2. **Determine Trigger Type** - Based on event_source (webhook, database, schedule)
3. **Create Trigger Summary** - Extract key info for quick access
4. **Find Subscriptions** - Get workflows subscribed to this trigger
5. **Evaluate Filters** - Check if trigger conditions are met
6. **Execute Workflows** - Start workflow execution asynchronously

### 2. Workflow Execution

```typescript
// Main workflow execution method
WorkflowEngineService.executeWorkflow(workflowId, context);
```

**Flow:**

1. **Load Workflow Definition** - Get active workflow with latest version
2. **Load Variables** - Merge workflow variables with context
3. **Create Workflow Run** - Initialize execution tracking
4. **Load Steps** - Get all steps for the workflow version
5. **Execute Steps** - Process each step with tracking
6. **Update Metrics** - Consolidate execution metrics
7. **Return Results** - Success/failure with execution data

### 3. Step Execution

```typescript
// Individual step execution with tracking
WorkflowEngineService.executeStepWithTracking(stepContext);
```

**Flow:**

1. **Create Step Run** - Initialize step tracking
2. **Route by Step Kind** - Action, condition, delay, etc.
3. **Execute Step Logic** - Call appropriate executor
4. **Update Step Run** - Record results and timing
5. **Handle Errors** - Retry logic and error tracking

### 4. Action Execution

```typescript
// Dynamic action execution
WorkflowActionExecutor.executeAction(actionKey, config, context);
```

**Flow:**

1. **Lookup Action Registry** - Find action definition
2. **Route by Execution Type** - Internal function, external API, conditional
3. **Execute Action Logic** - Call appropriate handler
4. **Return Results** - Success/failure with data

## 🎯 Action Types

### Internal Functions

Managed by your system (SMS, email, task management)

```typescript
// Example: Task Management Action
{
  "key": "task_management",
  "execution_type": "internal_function",
  "properties_schema": [
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "options",
      "options": [
        {"name": "Create", "value": "create"},
        {"name": "Update", "value": "update"},
        {"name": "Delete", "value": "delete"}
      ]
    }
  ]
}
```

### External APIs

Require credentials and authentication

```typescript
// Example: Google Drive Action
{
  "key": "google_drive",
  "execution_type": "external_api",
  "credentials_schema": {
    "required": ["googleApi"]
  },
  "operation_schema": {
    "file": {
      "operations": ["upload", "download", "delete"],
      "display_name": "File"
    }
  }
}
```

### Conditional Logic

For workflow branching

```typescript
// Example: If Condition
{
  "key": "condition_if",
  "execution_type": "conditional",
  "properties_schema": [
    {
      "displayName": "Conditions",
      "name": "conditions",
      "type": "filter"
    }
  ],
  "outputs": [
    {"displayName": "True", "type": "main"},
    {"displayName": "False", "type": "main"}
  ]
}
```

## 🎬 Trigger Types

### Database Triggers (Debezium)

Listen to database changes

```typescript
// Example: CRM Lead Event
{
  "key": "crm_lead_event",
  "event_source": "debezium",
  "available_variables": {
    "lead_id": "string",
    "lead_name": "string",
    "lead_email": "string",
    "lead_status": "string",
    "operation": "string" // INSERT, UPDATE, DELETE
  },
  "sample_payload": {
    "before": null,
    "after": {"id": 1, "name": "John", "status": "new"},
    "operation": "INSERT"
  }
}
```

### Webhook Triggers

HTTP endpoint triggers

```typescript
// Example: Generic Webhook
{
  "key": "webhook_generic",
  "event_source": "webhook",
  "webhook_config": {
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "auth_required": false,
    "response_mode": "onReceived"
  },
  "available_variables": {
    "headers": "object",
    "body": "object",
    "query": "object"
  }
}
```

### Schedule Triggers

Cron-based triggers

```typescript
// Example: Schedule Trigger
{
  "key": "schedule_cron",
  "event_source": "schedule",
  "properties_schema": [
    {
      "displayName": "Cron Expression",
      "name": "cronExpression",
      "type": "string",
      "required": true
    }
  ]
}
```

## 🔍 Filter System

### Filter Conditions

Dynamic filter evaluation based on trigger variables

```typescript
interface FilterCondition {
  variable: string; // {{variable.status}}
  operator: string; // 'equals', 'not_equals', 'contains', 'greater_than'
  value: any; // User input value
  type: 'string' | 'number' | 'boolean' | 'date';
}

interface TriggerFilter {
  combinator: 'AND' | 'OR';
  conditions: FilterCondition[];
}
```

### Example Filter Usage

```typescript
// Filter: Only process leads that are not spam from website
{
  "combinator": "AND",
  "conditions": [
    {
      "variable": "{{variable.lead_status}}",
      "operator": "not_equals",
      "value": "spam",
      "type": "string"
    },
    {
      "variable": "{{variable.source}}",
      "operator": "equals",
      "value": "website",
      "type": "string"
    }
  ]
}
```

## 🛠️ Development Patterns

### Adding New Actions

1. **Register Action** in `workflow_action_registry` table
2. **Implement Handler** in `WorkflowActionExecutor`
3. **Add Credentials** (if external API)
4. **Test Execution**

### Adding New Triggers

1. **Register Trigger** in `workflow_trigger_registry` table
2. **Set up Event Source** (webhook endpoint, Debezium connector)
3. **Define Variables** and sample payload
4. **Test Filter Conditions**

### Creating Workflows

1. **Create Definition** with metadata
2. **Create Version** with steps and edges
3. **Subscribe to Triggers** with filter conditions
4. **Test Execution** with sample data

## 📁 Key Files

### Core Services

- `apps/api/src/workflow-registry/services/workflow-engine.service.ts` - Main execution engine
- `apps/api/src/workflow-registry/services/workflow-action.executor.ts` - Action execution
- `apps/api/src/workflow-registry/services/workflow-trigger.processor.ts` - Trigger processing
- `apps/api/src/workflow-registry/services/workflow-filter.service.ts` - Filter evaluation

### Entities

- `library/storage/src/lib/entity/workflow/` - All workflow entities
- `library/storage/src/lib/entity/task.ts` - Task management entity

### Configuration

- `apps/api/src/workflow-registry/workflow-registry.module.ts` - Module configuration
- `library/storage/src/lib/storage.module.ts` - Storage module

## 🚀 Usage Examples

### Execute a Workflow Manually

```typescript
const context: WorkflowContext = {
  triggerData: { leadId: '123', leadName: 'John Doe' },
  triggerType: 'manual',
  userId: 'user-123',
  executionMode: 'sync',
};

const result = await workflowEngineService.executeWorkflow('workflow-id', context);
```

### Process a Database Trigger

```typescript
const eventData = {
  before: null,
  after: { id: 1, name: 'John', status: 'new' },
  operation: 'INSERT',
  table: 'leads',
};

await workflowEngineService.processTriggerEvent('crm_lead_event', eventData);
```

### Create a Simple Workflow

```typescript
// 1. Create workflow definition
const workflow = await workflowRepository.save({
  name: 'Lead Processing',
  description: 'Process new leads from CRM',
  category: 'automation',
  is_active: true,
});

// 2. Create version with steps
const version = await versionRepository.save({
  workflow_id: workflow.id,
  version_num: 1,
  s3_key: `s3://workflows/${workflow.id}/v1.json`,
});

// 3. Create steps
const taskStep = await stepRepository.save({
  version_id: version.id,
  kind: 'action',
  action_key: 'task_management',
  name: 'Create Follow-up Task',
  cfg: {
    operation: 'create',
    title: 'Follow up with {{variable.lead_name}}',
    description: 'New lead from {{variable.source}}',
  },
});

// 4. Subscribe to trigger
await subscriptionRepository.save({
  workflow_id: workflow.id,
  trigger_key: 'crm_lead_event',
  filter_conditions: {
    combinator: 'AND',
    conditions: [
      {
        variable: '{{variable.lead_status}}',
        operator: 'equals',
        value: 'new',
        type: 'string',
      },
    ],
  },
  is_active: true,
});
```

## 🔒 Security Considerations

1. **Credential Encryption** - All external API credentials are encrypted
2. **Input Validation** - All trigger data and configurations are validated
3. **Rate Limiting** - Webhook endpoints have rate limiting
4. **Authentication** - Webhook endpoints support authentication
5. **Audit Trail** - All executions are logged and tracked

## 📈 Monitoring & Analytics

### Execution Metrics

- Success/failure rates per workflow
- Execution time distribution
- Error patterns and frequency
- Cache hit rates
- Network call statistics

### Performance Tracking

- Queue time monitoring
- Memory usage patterns
- CPU utilization
- Step-level performance

### Alerting

- Failed workflow executions
- High error rates
- Performance degradation
- Credential expiration

This architecture provides a robust, scalable, and maintainable workflow execution system that can handle complex automation scenarios while maintaining high performance and reliability.
