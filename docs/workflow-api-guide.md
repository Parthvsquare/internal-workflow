# Workflow Generation API Guide

## Overview

The Workflow Generation API allows you to create, manage, and execute n8n-style workflows that connect triggers (like database changes) to actions (like creating tasks). This enables automation of business processes such as creating follow-up tasks when lead statuses change.

## Base URL

```
/api/workflows
```

## Authentication

Currently, no authentication is required (will be added later).

## Core Concepts

### Workflow Structure

A workflow consists of:

- **Trigger**: What starts the workflow (e.g., database change)
- **Steps**: Actions to perform (e.g., create task, send email)
- **Edges**: Connections between steps
- **Filters**: Conditions to determine if workflow should run

### Workflow Segments

- `CRM`: Customer relationship management workflows
- `SALES`: Sales process workflows
- `MARKETING`: Marketing automation workflows

### Step Types

- `ACTION`: Perform an action (create task, send email, etc.)
- `CONDITION`: Branch based on conditions
- `DELAY`: Wait for a specified time
- `LOOP`: Repeat actions

## API Endpoints

### 1. Create Workflow

**POST** `/api/workflows`

Creates a new workflow with trigger, steps, and connections.

#### Request Body

```json
{
  "name": "Lead Status Change to Task Creation",
  "description": "Automatically create follow-up tasks when lead status changes",
  "segment": "CRM",
  "trigger": {
    "triggerKey": "lead_database_change",
    "properties": {
      "table_name": "leads",
      "change_type": ["UPDATE"],
      "monitor_fields": ["status"]
    },
    "filters": {
      "combinator": "AND",
      "conditions": [
        {
          "variable": "{{variable.after_status}}",
          "operator": "equals",
          "value": "contacted",
          "type": "string"
        }
      ]
    }
  },
  "steps": [
    {
      "name": "Create Follow-up Task",
      "kind": "ACTION",
      "actionKey": "taskManagement",
      "configuration": {
        "resource": "task",
        "operation": "create",
        "parameters": {
          "title": "Follow up with {{variable.after_name}}",
          "description": "Lead status changed. Follow up within 24 hours.",
          "status": "pending",
          "entityType": "crm_leads"
        }
      }
    }
  ],
  "edges": [
    {
      "fromStep": "trigger",
      "toStep": "Create Follow-up Task",
      "branchKey": "default"
    }
  ],
  "isActive": true
}
```

#### Response

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Lead Status Change to Task Creation",
  "description": "Automatically create follow-up tasks when lead status changes",
  "segment": "CRM",
  "latestVersion": 1,
  "isActive": true,
  "createdAt": "2023-12-01T10:00:00Z",
  "updatedAt": "2023-12-01T10:00:00Z",
  "trigger": {
    /* trigger configuration */
  },
  "steps": [
    /* steps array */
  ],
  "edges": [
    /* edges array */
  ]
}
```

### 2. List Workflows

**GET** `/api/workflows`

Retrieves all workflows.

#### Response

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Lead Status Change to Task Creation",
    "segment": "CRM",
    "latestVersion": 1,
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00Z",
    "updatedAt": "2023-12-01T10:00:00Z"
  }
]
```

### 3. Get Workflow

**GET** `/api/workflows/{id}`

Retrieves a specific workflow with full configuration.

#### Response

Same as create workflow response.

### 4. Update Workflow

**PUT** `/api/workflows/{id}`

Updates an existing workflow. Creates a new version if steps or trigger are modified.

#### Request Body

Same structure as create, but all fields are optional.

### 5. Delete Workflow

**DELETE** `/api/workflows/{id}`

Deletes a workflow and all its versions.

#### Response

`204 No Content`

### 6. Execute Workflow

**POST** `/api/workflows/{id}/execute`

Manually triggers a workflow execution.

#### Request Body

```json
{
  "triggerData": {
    "eventId": "manual-trigger",
    "leadId": "lead_12345",
    "oldStatus": "new",
    "newStatus": "contacted"
  },
  "variables": {
    "customField": "value"
  },
  "userId": "user_123"
}
```

#### Response

```json
{
  "success": true,
  "runId": "run_987654321",
  "error": null
}
```

## Filter System

### Filter Operators

- `equals` / `not_equals`: Exact match
- `contains` / `not_contains`: String contains
- `greater_than` / `less_than`: Numeric comparison
- `between`: Value between two numbers
- `in` / `not_in`: Value in array
- `is_empty` / `is_not_empty`: Null/empty check
- `starts_with` / `ends_with`: String prefix/suffix
- `after` / `before`: Date comparison

### Filter Combinators

- `AND`: All conditions must be true
- `OR`: At least one condition must be true

## Variable System

### Available Variables

Variables depend on the trigger type. For database triggers:

- `{{variable.before_*}}`: Values before change
- `{{variable.after_*}}`: Values after change
- `{{variable.operation}}`: Type of change (INSERT, UPDATE, DELETE)
- `{{variable.event_timestamp}}`: When the change occurred

### Variable Usage

Variables can be used in:

- Filter conditions
- Step configuration parameters
- Action parameters

Example:

```json
{
  "title": "Follow up with {{variable.after_name}}",
  "description": "Status changed from {{variable.before_status}} to {{variable.after_status}}"
}
```

## Action Registry

Before creating workflows, ensure the required actions exist in the action registry:

### Task Management Action

```json
{
  "key": "taskManagement",
  "name": "taskManagement",
  "display_name": "Task Management",
  "category": "internal",
  "operations": {
    "task": {
      "operations": ["create", "update", "delete", "get", "list"]
    }
  }
}
```

## Trigger Registry

Ensure required triggers exist in the trigger registry:

### Lead Database Change Trigger

```json
{
  "key": "lead_database_change",
  "name": "lead_database_change",
  "display_name": "Lead Database Change",
  "category": "Database",
  "event_source": "debezium"
}
```

## Example Workflows

### 1. Simple Lead to Task Workflow

Creates a task when a lead status changes to "contacted":

```bash
curl -X POST /api/workflows \
  -H "Content-Type: application/json" \
  -d @sample-workflow-creation.json
```

### 2. Multi-Step Workflow

Create task → Send email → Update CRM:

```json
{
  "name": "Lead Qualification Process",
  "segment": "CRM",
  "trigger": {
    /* trigger config */
  },
  "steps": [
    {
      "name": "Create Task",
      "kind": "ACTION",
      "actionKey": "taskManagement",
      "configuration": {
        /* task config */
      }
    },
    {
      "name": "Send Email",
      "kind": "ACTION",
      "actionKey": "emailSend",
      "configuration": {
        /* email config */
      }
    }
  ],
  "edges": [
    {
      "fromStep": "trigger",
      "toStep": "Create Task"
    },
    {
      "fromStep": "Create Task",
      "toStep": "Send Email"
    }
  ]
}
```

### 3. Conditional Workflow

Branch based on lead score:

```json
{
  "steps": [
    {
      "name": "Check Lead Score",
      "kind": "CONDITION",
      "configuration": {
        "conditions": {
          "combinator": "AND",
          "conditions": [
            {
              "variable": "{{variable.after_lead_score}}",
              "operator": "greater_than",
              "value": 80,
              "type": "number"
            }
          ]
        }
      }
    },
    {
      "name": "High Priority Task",
      "kind": "ACTION",
      "actionKey": "taskManagement"
    },
    {
      "name": "Normal Task",
      "kind": "ACTION",
      "actionKey": "taskManagement"
    }
  ],
  "edges": [
    {
      "fromStep": "Check Lead Score",
      "toStep": "High Priority Task",
      "branchKey": "true"
    },
    {
      "fromStep": "Check Lead Score",
      "toStep": "Normal Task",
      "branchKey": "false"
    }
  ]
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Trigger 'invalid_trigger' not found in registry",
  "error": "Bad Request"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Workflow with ID abc123 not found",
  "error": "Not Found"
}
```

#### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Testing

### Using cURL

```bash
# Create workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d @sample-workflow-creation.json

# List workflows
curl http://localhost:3000/api/workflows

# Get specific workflow
curl http://localhost:3000/api/workflows/123e4567-e89b-12d3-a456-426614174000

# Execute workflow
curl -X POST http://localhost:3000/api/workflows/123e4567-e89b-12d3-a456-426614174000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "triggerData": {
      "eventId": "test-123",
      "leadId": "lead_456"
    }
  }'
```

### Using Swagger UI

Access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

## Next Steps

1. **Add Authentication**: Implement user authentication and authorization
2. **Add Validation**: Enhanced validation for trigger/action compatibility
3. **Add Monitoring**: Workflow execution monitoring and metrics
4. **Add Templates**: Pre-built workflow templates for common use cases
5. **Add Versioning**: Better version management and rollback capabilities
