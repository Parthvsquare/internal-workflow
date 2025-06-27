# Testing Dynamic Workflow System

## Overview

The workflow system is now completely dynamic and registry-driven. Here's how it works:

## Flow:

1. **Database Change** → Debezium CDC → Kafka Topic
2. **Worker Service** → Loads trigger registries → Matches events to triggers
3. **Trigger Match** → Calls workflow engine API → Finds subscribed workflows
4. **Workflow Execution** → Executes actions based on action registry

## Setup Test Data

### 1. Create Trigger Registry Entry (Database Changes)

```sql
INSERT INTO workflow_trigger_registry (
  key, name, display_name, description, category, event_source,
  properties_schema, is_active
) VALUES (
  'any_table_change',
  'anyTableChange',
  'Any Table Change',
  'Trigger when any monitored table changes',
  'database',
  'debezium',
  '[
    {
      "name": "table_name",
      "type": "options",
      "options": [
        {"name": "Leads", "value": "leads"},
        {"name": "Users", "value": "users"},
        {"name": "Orders", "value": "orders"}
      ],
      "default": "leads"
    },
    {
      "name": "change_type",
      "type": "multiOptions",
      "options": [
        {"name": "Insert", "value": "INSERT"},
        {"name": "Update", "value": "UPDATE"},
        {"name": "Delete", "value": "DELETE"}
      ],
      "default": ["INSERT", "UPDATE"]
    }
  ]'::jsonb,
  true
);
```

### 2. Create Action Registry Entry (Task Creation)

```sql
INSERT INTO workflow_action_registry (
  key, name, display_name, description, category, execution_type,
  properties_schema, is_active
) VALUES (
  'create_task_dynamic',
  'createTaskDynamic',
  'Create Task Dynamically',
  'Create task from any trigger data',
  'internal',
  'internal_function',
  '[
    {
      "name": "operation",
      "type": "options",
      "options": [
        {"name": "Create", "value": "create"},
        {"name": "Update", "value": "update"}
      ],
      "default": "create"
    },
    {
      "name": "title",
      "type": "string",
      "description": "Task title (can use {{trigger.after.name}} syntax)"
    },
    {
      "name": "description",
      "type": "string",
      "description": "Task description (can use trigger data)"
    }
  ]'::jsonb,
  true
);
```

### 3. Create Workflow

```javascript
// POST /api/workflow-generation/workflows
{
  "name": "Dynamic Lead to Task",
  "segment": "CRM",
  "trigger": {
    "triggerKey": "any_table_change",
    "filters": {}
  },
  "steps": [
    {
      "name": "createTask",
      "kind": "ACTION",
      "actionKey": "create_task_dynamic",
      "configuration": {
        "operation": "create",
        "title": "Follow up with {{trigger.after.name}}",
        "description": "Lead status changed from {{trigger.before.status}} to {{trigger.after.status}}"
      }
    }
  ],
  "edges": []
}
```

### 4. Create Workflow Subscription

```javascript
// POST /api/workflow-subscriptions
{
  "workflowId": "workflow-uuid-here",
  "triggerKey": "any_table_change",
  "filterConditions": {
    "table": "leads",
    "operation": ["INSERT", "UPDATE"]
  }
}
```

## Test the Flow

### 1. Simulate Database Change

```javascript
// Call worker service test endpoint
// POST /test/cdc-event
{
  "table": "leads",
  "operation": "UPDATE",
  "before": {
    "id": "lead123",
    "name": "John Doe",
    "status": "new",
    "email": "john@example.com"
  },
  "after": {
    "id": "lead123",
    "name": "John Doe",
    "status": "qualified",
    "email": "john@example.com"
  }
}
```

### 2. Expected Results

The system should:

1. ✅ Worker service matches event to `any_table_change` trigger
2. ✅ Calls workflow engine with trigger data
3. ✅ Finds workflow subscribed to trigger
4. ✅ Executes workflow steps
5. ✅ Creates task with title: "Follow up with John Doe"
6. ✅ Task description: "Lead status changed from new to qualified"

## Key Benefits

### ✅ Completely Dynamic

- No hardcoded table names or actions
- Everything driven by registry configuration
- Easy to add new triggers and actions

### ✅ Flexible Data Mapping

- Actions can extract data from trigger context
- Supports variable substitution: `{{trigger.after.field}}`
- Fallback to default values

### ✅ Scalable Architecture

- Worker service auto-loads trigger registries
- Actions route based on execution_type and category
- Easy to extend with new action types

## Adding New Triggers/Actions

### New Trigger (e.g., Email Events)

```sql
INSERT INTO workflow_trigger_registry (
  key, name, event_source, properties_schema, ...
) VALUES (
  'email_received', 'emailReceived', 'webhook',
  '[{"name": "from_domain", "type": "string"}]'::jsonb, ...
);
```

### New Action (e.g., Send Slack Message)

```sql
INSERT INTO workflow_action_registry (
  key, name, category, execution_type, properties_schema, ...
) VALUES (
  'slack_send', 'slackSend', 'communication', 'external_api',
  '[{"name": "channel", "type": "string"}, {"name": "message", "type": "string"}]'::jsonb, ...
);
```

The system will automatically:

- Load new triggers and start matching events
- Route new actions to appropriate executors
- Support all existing workflows without code changes

## File Changes Summary

### ✅ Worker Service (`workflow-kafka.consumer.ts`)

- Loads trigger registries dynamically
- Matches events to triggers based on properties_schema
- Calls workflow engine for any matching trigger

### ✅ Action Executor (`workflow-action.executor.ts`)

- Routes actions based on execution_type and category
- Extracts data from trigger context dynamically
- Supports variable substitution

### ✅ Workflow Engine (`workflow-engine.service.ts`)

- Uses subscription system to find workflows
- Passes trigger data through to actions
- Completely registry-driven execution

Now the system is truly dynamic - you can add any trigger/action through the registry without touching code!
