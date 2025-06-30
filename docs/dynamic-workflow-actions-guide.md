# Dynamic Workflow Actions Guide

## Overview

The dynamic workflow action system allows **non-developers** (sales, marketing, operations teams) to create and configure workflow actions through database entries without requiring code changes. This eliminates the need for developers to code every new action.

## How It Works

### 1. Registry-Driven Architecture

Instead of hardcoded action handlers, the system now uses a **registry-driven approach**:

```typescript
// Old way (hardcoded):
switch (actionKey) {
  case 'task_management':
    return this.executeTaskManagement(config, context);
  case 'send_email':
    return this.executeSendEmail(config, context);
  // Need to add code for every new action
}

// New way (registry-driven):
const actionRegistry = await this.actionRegistry.findOne({
  where: { key: actionKey, is_active: true },
});
return await this.executeRegistryAction(actionRegistry, config, context);
```

### 2. Action Types

The system supports three types of actions:

| Type                | Description                    | Examples                      |
| ------------------- | ------------------------------ | ----------------------------- |
| `internal_function` | Actions handled by your system | Task creation, SMS, Email     |
| `external_api`      | Third-party API calls          | Google Drive, Slack, CRM APIs |
| `conditional`       | Logic branching                | If/then conditions, filters   |

### 3. Configuration Through Database

All action configurations are stored in the `workflow_action_registry` table with JSON schemas that define:

- **Properties Schema**: What fields the action accepts
- **Validation Rules**: Required fields, data types, options
- **UI Configuration**: How fields should be displayed
- **Sample Payloads**: Example configurations

## Creating New Actions (No Code Required!)

### Step 1: Add Action to Registry

Run SQL to insert a new action definition:

```sql
INSERT INTO workflow_action_registry (
  id, key, name, display_name, description, category,
  execution_type, is_active, properties_schema, sample_payload
) VALUES (
  gen_random_uuid(),
  'slack_notification',  -- Unique action key
  'Slack Notification',
  'Send Slack Message',
  'Send notifications to Slack channels',
  'communication',
  'internal_function',   -- or 'external_api'
  true,
  '{ ... schema definition ... }',
  '{ ... example config ... }'
);
```

### Step 2: Define Properties Schema

The `properties_schema` defines what fields users can configure:

```json
{
  "type": "object",
  "properties": {
    "channel": {
      "displayName": "Slack Channel",
      "type": "string",
      "required": true,
      "placeholder": "#general or {{variable.team_channel}}",
      "description": "Slack channel to send message to"
    },
    "message": {
      "displayName": "Message",
      "type": "string",
      "required": true,
      "typeOptions": { "rows": 3 },
      "placeholder": "Hello {{variable.after.name}}!",
      "description": "Message content (supports template variables)"
    },
    "urgency": {
      "displayName": "Urgency Level",
      "type": "options",
      "default": "normal",
      "options": [
        { "name": "Low", "value": "low" },
        { "name": "Normal", "value": "normal" },
        { "name": "High", "value": "high" },
        { "name": "Critical", "value": "critical" }
      ]
    }
  }
}
```

### Step 3: Implement Handler (One-Time Developer Task)

For `internal_function` actions, a developer adds the handler once:

```typescript
// In WorkflowActionExecutor.executeInternalFunction()
case 'slack_notification':
  return await this.executeSlackNotification(config, context);
```

```typescript
private async executeSlackNotification(config: any, context: WorkflowContext) {
  const { channel, message, urgency } = config;

  // Implementation using Slack API
  const result = await this.slackService.sendMessage({
    channel,
    text: message,
    priority: urgency
  });

  return {
    success: true,
    result: { messageId: result.ts, channel }
  };
}
```

### Step 4: Business Users Configure Actions

Business users can now configure this action in workflows:

```json
{
  "action_key": "slack_notification",
  "config": {
    "channel": "#sales-alerts",
    "message": "New lead: {{variable.after.name}} from {{variable.after.source}}",
    "urgency": "high"
  }
}
```

## Template Variables

Actions support dynamic template variables that get replaced at runtime:

### Variable Sources

| Source            | Syntax                    | Description                 |
| ----------------- | ------------------------- | --------------------------- |
| Trigger Data      | `{{variable.after.name}}` | Data from the trigger event |
| Context Variables | `{{variable.user_id}}`    | Workflow context variables  |
| Trigger Variables | `{{trigger.operation}}`   | Direct trigger data access  |

### Example Template Usage

```json
{
  "title": "Follow up with {{variable.after.name}}",
  "description": "Lead from {{variable.after.source}} needs attention.\n\nDetails:\n- Email: {{variable.after.email}}\n- Phone: {{variable.after.phone}}\n- Status: {{variable.after.status}}",
  "dueDate": "+1d",
  "entityId": "{{variable.after.code}}"
}
```

## Advanced Features

### 1. Dynamic Due Dates

Support for relative date calculations:

```json
{
  "dueDateDynamic": "+1d", // 1 day from now
  "dueDateDynamic": "+2h", // 2 hours from now
  "dueDateDynamic": "+30m", // 30 minutes from now
  "dueDateDynamic": "-1d" // 1 day ago
}
```

### 2. Conditional Logic

Business users can create conditional actions:

```json
{
  "conditions": {
    "combinator": "AND",
    "conditions": [
      {
        "variable": "{{variable.after.status}}",
        "operator": "equals",
        "value": "hot_lead",
        "type": "string"
      },
      {
        "variable": "{{variable.after.score}}",
        "operator": "greater_than",
        "value": 80,
        "type": "number"
      }
    ]
  }
}
```

### 3. External API Actions

For external APIs, define credential requirements:

```json
{
  "execution_type": "external_api",
  "credentials_schema": {
    "required": ["slackApi"],
    "slackApi": {
      "displayName": "Slack API Token",
      "type": "oauth2",
      "scopes": ["chat:write", "channels:read"]
    }
  },
  "operation_schema": {
    "message": {
      "operations": ["send", "update", "delete"],
      "displayName": "Message Operations"
    }
  }
}
```

## Business User Workflow

### For Sales/Marketing Teams:

1. **Identify Need**: "I want to send a Slack notification when high-value leads come in"

2. **Check Registry**: Look at available actions in the workflow builder UI

3. **Configure Action**: Use the UI to configure the action with their specific requirements:

   - Channel: `#sales-team`
   - Message: `🔥 Hot lead: {{variable.after.name}} (Score: {{variable.after.score}})`
   - Urgency: `high`

4. **Test Workflow**: Run test with sample data to verify it works

5. **Activate**: Enable the workflow to start processing real triggers

### For Developers (One-Time Setup):

1. **Add Registry Entry**: Insert action definition with schema
2. **Implement Handler**: Write the actual execution logic once
3. **Test Integration**: Verify the action works with the registry system
4. **Document**: Update this guide with the new action details

## Benefits

### For Business Users:

- ✅ **No Code Required**: Create complex workflows through UI configuration
- ✅ **Immediate Deployment**: Changes take effect without development cycles
- ✅ **Template Variables**: Dynamic content based on trigger data
- ✅ **Visual Validation**: Schema-driven UI with validation and help text

### For Developers:

- ✅ **Write Once, Use Many**: Implement action logic once, configure many ways
- ✅ **Reduced Backlog**: Business teams can self-serve workflow modifications
- ✅ **Cleaner Code**: Registry-driven approach instead of growing switch statements
- ✅ **Easy Testing**: Actions can be tested independently with mock data

### For Operations:

- ✅ **Faster Iteration**: A/B test different workflow configurations
- ✅ **Business Agility**: Respond quickly to changing business requirements
- ✅ **Reduced Dependencies**: Less reliance on development team for workflow changes
- ✅ **Audit Trail**: All configurations stored in database with history

## Example: Complete Task Management Action

Here's how the task management action is configured in the registry:

```sql
-- Registry configuration that enables non-developers to create tasks
INSERT INTO workflow_action_registry VALUES (
  gen_random_uuid(),
  'task_management',
  'Task Management',
  'Create & Manage Tasks',
  'Create, update, or delete tasks with dynamic due dates',
  'internal',
  ARRAY['action'],
  'task',
  '#4F46E5',
  'internal_function',
  1,
  true,
  '{
    "type": "object",
    "properties": {
      "operation": {
        "displayName": "Operation",
        "type": "options",
        "required": true,
        "default": "create",
        "options": [
          {"name": "Create Task", "value": "create"},
          {"name": "Update Task", "value": "update"}
        ]
      },
      "title": {
        "displayName": "Task Title",
        "type": "string",
        "required": true,
        "placeholder": "{{variable.after.name}} needs follow up"
      },
      "dueDateDynamic": {
        "displayName": "Due Date",
        "type": "string",
        "placeholder": "+1d, +2h, +30m",
        "description": "When the task is due (relative to now)"
      }
    }
  }',
  '{
    "operation": "create",
    "title": "Follow up with {{variable.after.name}}",
    "dueDateDynamic": "+1d",
    "priority": "high"
  }'
);
```

Business users can now create tasks through workflows without any code:

```json
{
  "trigger": "lead_source_activation",
  "actions": [
    {
      "action_key": "task_management",
      "config": {
        "operation": "create",
        "title": "Setup campaign for {{variable.after.name}}",
        "description": "New lead source activated: {{variable.after.code}}",
        "dueDateDynamic": "+1d",
        "priority": "high",
        "entityType": "crm_leads",
        "entityId": "{{variable.after.code}}"
      }
    }
  ]
}
```

## Next Steps

1. **Run the Registry Setup**: Execute `docs/sql/dynamic-action-registry-setup.sql`
2. **Test Task Creation**: Verify your workflow now creates actual tasks in the database
3. **Add New Actions**: Use this guide to add Slack, email, or other actions as needed
4. **Train Business Users**: Show them how to configure actions through the UI
5. **Monitor Usage**: Track which actions are most commonly used to prioritize improvements

This system transforms your workflow platform from a developer-dependent tool into a business-user-friendly automation platform! 🚀
