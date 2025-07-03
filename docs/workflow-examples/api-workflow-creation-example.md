# Complete Workflow Creation Example

This example demonstrates how to create a workflow that triggers when a lead source is activated and automatically creates a setup task.

## Prerequisites

1. **Insert Required Registries**: First, make sure both registries are populated:

```bash
# Insert lead sources trigger registry
psql -d your_database -f docs/sql/insert-lead-sources-trigger-registry.sql

# Insert task management action registry
psql -d your_database -f docs/sql/insert-task-management-action-registry.sql
```

## Step 1: Create the Workflow

### API Request

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Source Activation Workflow",
    "description": "Automatically create setup tasks when lead sources are activated",
    "segment": "lead_management",
    "isActive": true,
    "createdBy": "system",
    "trigger": {
      "triggerKey": "lead_sources_table_change",
      "filters": {
        "combinator": "AND",
        "conditions": [
          {
            "variable": "{{variable.operation}}",
            "operator": "equals",
            "value": "UPDATE",
            "type": "string"
          },
          {
            "variable": "{{variable.after.is_active}}",
            "operator": "equals",
            "value": true,
            "type": "boolean"
          },
          {
            "variable": "{{variable.before.is_active}}",
            "operator": "equals",
            "value": false,
            "type": "boolean"
          }
        ]
      }
    },
    "steps": [
      {
        "name": "create_setup_task",
        "kind": "action",
        "actionKey": "task_management",
        "configuration": {
          "resource": "task",
          "operation": "create",
          "parameters": {
            "operation": "create",
            "title": "Setup marketing campaign for {{variable.after.name}}",
            "description": "Lead source '\''{{variable.after.name}}'\'' ({{variable.after.code}}) has been activated.\\n\\nRequired actions:\\n1. Set up tracking codes\\n2. Configure lead routing\\n3. Create marketing materials\\n4. Test lead capture forms\\n5. Notify sales team\\n\\nLead Source Details:\\n- Code: {{variable.after.code}}\\n- Name: {{variable.after.name}}\\n- Display Order: {{variable.after.display_order}}\\n- Activated: {{variable.timestamp}}",
            "status": "pending",
            "priority": "high",
            "dueDateDynamic": "+1d",
            "entityType": "crm_leads",
            "entityId": "{{variable.after.code}}",
            "additionalData": {
              "lead_source_code": "{{variable.after.code}}",
              "lead_source_name": "{{variable.after.name}}",
              "activation_date": "{{variable.timestamp}}",
              "previous_status": "{{variable.before.is_active}}",
              "workflow_trigger": "lead_source_activation"
            }
          }
        }
      }
    ],
    "edges": []
  }'
```

### Expected Response

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Lead Source Activation Workflow",
  "description": "Automatically create setup tasks when lead sources are activated",
  "segment": "lead_management",
  "latestVersion": 1,
  "isActive": true,
  "createdBy": "system",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "trigger": {
    "triggerKey": "lead_sources_table_change",
    "filters": {
      "combinator": "AND",
      "conditions": [
        {
          "variable": "{{variable.operation}}",
          "operator": "equals",
          "value": "UPDATE",
          "type": "string"
        },
        {
          "variable": "{{variable.after.is_active}}",
          "operator": "equals",
          "value": true,
          "type": "boolean"
        },
        {
          "variable": "{{variable.before.is_active}}",
          "operator": "equals",
          "value": false,
          "type": "boolean"
        }
      ]
    }
  },
  "steps": [
    {
      "name": "create_setup_task",
      "kind": "action",
      "actionKey": "task_management",
      "configuration": {
        "resource": "task",
        "operation": "create",
        "parameters": {
          "operation": "create",
          "title": "Setup marketing campaign for {{variable.after.name}}",
          "description": "Lead source '{{variable.after.name}}' ({{variable.after.code}}) has been activated...",
          "status": "pending",
          "priority": "high",
          "dueDateDynamic": "+1d",
          "entityType": "crm_leads",
          "entityId": "{{variable.after.code}}"
        }
      }
    }
  ],
  "edges": []
}
```

## Step 2: Test the Workflow

### Manual Execution

```bash
# Test with sample data
curl -X POST http://localhost:3000/api/workflows/123e4567-e89b-12d3-a456-426614174000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "triggerData": {
      "operation": "UPDATE",
      "table": "lead_sources",
      "timestamp": "2024-01-15T10:30:00Z",
      "before": {
        "code": "SOCIAL_MEDIA",
        "name": "Social Media Campaign",
        "is_active": false,
        "display_order": 3
      },
      "after": {
        "code": "SOCIAL_MEDIA",
        "name": "Social Media Campaign",
        "is_active": true,
        "display_order": 3
      }
    }
  }'
```

### Expected Response

```json
{
  "success": true,
  "runId": "manual-run-1705312200000",
  "taskCreated": {
    "id": "task-456e7890-e89b-12d3-a456-426614174000",
    "title": "Setup marketing campaign for Social Media Campaign",
    "description": "Lead source 'Social Media Campaign' (SOCIAL_MEDIA) has been activated...",
    "status": "pending",
    "priority": "high",
    "dueDate": "2024-01-16T10:30:00Z",
    "entityType": "crm_leads",
    "entityId": "SOCIAL_MEDIA"
  }
}
```

## Step 3: Database Trigger (Real-world Scenario)

When Debezium captures a real database change:

```sql
-- This UPDATE will trigger the workflow
UPDATE lead_sources
SET is_active = true
WHERE code = 'SOCIAL_MEDIA' AND is_active = false;
```

The workflow engine will:

1. **Receive trigger data** from Debezium
2. **Filter the event** using the workflow conditions
3. **Execute the task action** to create a new task
4. **Store the task** in your task entity table

## Step 4: Verify Results

### Check Created Tasks

```bash
# List tasks created by the workflow
curl -X GET http://localhost:3000/api/tasks?entityType=crm_leads&entityId=SOCIAL_MEDIA
```

### Check Workflow Runs

```bash
# Get workflow execution history
curl -X GET http://localhost:3000/api/workflows/123e4567-e89b-12d3-a456-426614174000/runs
```

## Advanced Example: Multiple Actions

Here's how to extend the workflow with multiple steps:

```json
{
  "steps": [
    {
      "name": "create_setup_task",
      "kind": "action",
      "actionKey": "task_management",
      "configuration": {
        "parameters": {
          "operation": "create",
          "title": "Setup marketing campaign for {{variable.after.name}}",
          "priority": "high"
        }
      }
    },
    {
      "name": "send_notification",
      "kind": "action",
      "actionKey": "email_send",
      "configuration": {
        "parameters": {
          "to": "marketing@company.com",
          "subject": "New Lead Source Activated: {{variable.after.name}}",
          "body": "A new lead source has been activated and requires setup."
        }
      }
    }
  ],
  "edges": [
    {
      "fromStep": "create_setup_task",
      "toStep": "send_notification",
      "branchKey": "default"
    }
  ]
}
```

## Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/workflow_db
WORKFLOW_ENGINE_URL=http://localhost:4200
DEBEZIUM_CONNECTOR_URL=http://localhost:8083
```

## Success Indicators

✅ **Workflow Created**: API returns 201 with workflow ID  
✅ **Registries Valid**: No validation errors for trigger/action keys  
✅ **Filter Logic**: Only activations (false→true) trigger the workflow  
✅ **Task Created**: New task appears in task entity with correct data  
✅ **Variables Interpolated**: Task title/description contains actual lead source data

This demonstrates the complete integration between your trigger registry, action registry, and workflow generation system!
