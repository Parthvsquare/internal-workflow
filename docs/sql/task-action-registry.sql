INSERT INTO workflow_action_registry (
  key,
  name,
  display_name,
  description,
  category,
  "group",
  icon,
  icon_color,
  documentation_url,
  version,
  is_active,
  properties_schema,
  credentials_schema,
  operation_schema,
  filter_schema,
  sample_payload,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'taskManagement',
  'Task Management',
  'Create, update, delete and manage tasks in the system',
  'internal',
  'action',
  'fas:tasks',
  '#4F46E5',
  '/docs/actions/task-management',
  1,
  true,
  '[
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "options",
      "options": [
        { "name": "Create Task", "value": "create" },
        { "name": "Update Task", "value": "update" },
        { "name": "Delete Task", "value": "delete" },
        { "name": "Get Task", "value": "get" },
        { "name": "List Tasks", "value": "list" }
      ],
      "default": "create",
      "required": true
    },
    {
      "displayName": "Task ID",
      "name": "taskId",
      "type": "string",
      "displayOptions": {
        "show": {
          "operation": ["update", "delete", "get"]
        }
      },
      "required": true,
      "placeholder": "Enter task UUID",
      "description": "The unique identifier of the task"
    },
    {
      "displayName": "Title",
      "name": "title",
      "type": "string",
      "displayOptions": {
        "show": {
          "operation": ["create", "update"]
        }
      },
      "required": true,
      "placeholder": "Enter task title",
      "validation": [
        {
          "type": "maxLength",
          "properties": {
            "maxLength": 255,
            "errorMessage": "Title cannot exceed 255 characters"
          }
        }
      ]
    },
    {
      "displayName": "Description",
      "name": "description",
      "type": "string",
      "typeOptions": {
        "rows": 4
      },
      "displayOptions": {
        "show": {
          "operation": ["create", "update"]
        }
      },
      "placeholder": "Enter task description",
      "description": "Detailed description of the task"
    },
    {
      "displayName": "Due Date",
      "name": "dueDate",
      "type": "dateTime",
      "displayOptions": {
        "show": {
          "operation": ["create", "update"]
        }
      },
      "description": "When the task should be completed"
    },
    {
      "displayName": "Status",
      "name": "status",
      "type": "options",
      "options": [
        { "name": "Pending", "value": "pending" },
        { "name": "In Progress", "value": "in_progress" },
        { "name": "Completed", "value": "completed" },
        { "name": "Cancelled", "value": "cancelled" },
        { "name": "Expired", "value": "expired" }
      ],
      "default": "pending",
      "displayOptions": {
        "show": {
          "operation": ["create", "update"]
        }
      },
      "description": "Current status of the task"
    },
    {
      "displayName": "Entity Type",
      "name": "entityType",
      "type": "options",
      "options": [
        { "name": "CRM Lead", "value": "crm_leads" }
      ],
      "default": "crm_leads",
      "displayOptions": {
        "show": {
          "operation": ["create", "update"]
        }
      },
      "description": "Type of entity this task is related to"
    },
    {
      "displayName": "Cron Expression",
      "name": "cronExpression",
      "type": "string",
      "displayOptions": {
        "show": {
          "operation": ["create", "update"]
        }
      },
      "placeholder": "0 9 * * 1-5",
      "validation": [
        {
          "type": "maxLength",
          "properties": {
            "maxLength": 20,
            "errorMessage": "Cron expression cannot exceed 20 characters"
          }
        },
        {
          "type": "regex",
          "properties": {
            "regex": "^([0-9*,/-]+\\s+){4}[0-9*,/-]+$|^@(annually|yearly|monthly|weekly|daily|hourly|reboot)$",
            "errorMessage": "Invalid cron expression format"
          }
        }
      ],
      "description": "Cron expression for recurring tasks (optional)"
    },
    {
      "displayName": "Filters",
      "name": "filters",
      "type": "collection",
      "displayOptions": {
        "show": {
          "operation": ["list"]
        }
      },
      "placeholder": "Add filter",
      "default": {},
      "options": [
        {
          "displayName": "Status",
          "name": "status",
          "type": "multiOptions",
          "options": [
            { "name": "Pending", "value": "pending" },
            { "name": "In Progress", "value": "in_progress" },
            { "name": "Completed", "value": "completed" },
            { "name": "Cancelled", "value": "cancelled" },
            { "name": "Expired", "value": "expired" }
          ]
        },
        {
          "displayName": "Entity Type",
          "name": "entityType",
          "type": "options",
          "options": [
            { "name": "CRM Lead", "value": "crm_leads" }
          ]
        },
        {
          "displayName": "Due Date From",
          "name": "dueDateFrom",
          "type": "dateTime"
        },
        {
          "displayName": "Due Date To", 
          "name": "dueDateTo",
          "type": "dateTime"
        }
      ]
    },
    {
      "displayName": "Limit",
      "name": "limit",
      "type": "number",
      "displayOptions": {
        "show": {
          "operation": ["list"]
        }
      },
      "default": 50,
      "typeOptions": {
        "minValue": 1,
        "maxValue": 1000
      },
      "description": "Maximum number of tasks to return"
    },
    {
      "displayName": "Offset",
      "name": "offset", 
      "type": "number",
      "displayOptions": {
        "show": {
          "operation": ["list"]
        }
      },
      "default": 0,
      "typeOptions": {
        "minValue": 0
      },
      "description": "Number of tasks to skip"
    }
  ]'::jsonb,
  '{}'::jsonb,
  '{
    "task": {
      "operations": ["create", "update", "delete", "get", "list"],
      "display_name": "Task"
    }
  }'::jsonb,
  '[
    {
      "displayName": "Title",
      "name": "title",
      "type": "string",
      "operators": ["equals", "not_equals", "contains", "starts_with", "ends_with", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "Status",
      "name": "status",
      "type": "options",
      "options": [
        { "name": "Pending", "value": "pending" },
        { "name": "In Progress", "value": "in_progress" },
        { "name": "Completed", "value": "completed" },
        { "name": "Cancelled", "value": "cancelled" },
        { "name": "Expired", "value": "expired" }
      ],
      "operators": ["equals", "not_equals", "in", "not_in"]
    },
    {
      "displayName": "Due Date",
      "name": "dueDate", 
      "type": "dateTime",
      "operators": ["equals", "after", "before", "between", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "Entity Type",
      "name": "entityType",
      "type": "options",
      "options": [
        { "name": "CRM Lead", "value": "crm_leads" }
      ],
      "operators": ["equals", "not_equals"]
    }
  ]'::jsonb,
  '{
    "success": true,
    "operation": "create",
    "data": {
      "entityId": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Follow up with John Doe",
      "description": "Call John Doe to discuss the proposal",
      "dueDate": "2024-01-20T14:00:00Z",
      "status": "pending",
      "entityType": "crm_leads",
      "cronExpression": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }'::jsonb,
  NOW(),
  NOW()
); 