-- Insert Task Management Action Registry
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
    execution_type,
    version,
    is_active,
    properties_schema,
    credentials_schema,
    operation_schema,
    filter_schema,
    sample_payload,
    methods
) VALUES (
    'task_management',
    'taskManagement',
    'Task Management',
    'Create, update, delete and manage tasks in the system based on incoming workflow data',
    'internal',
    '{"action"}',
    'fas:tasks',
    '#4F46E5',
    '/docs/actions/task-management',
    'internal_function',
    1,
    true,
    '{
        "properties": [
            {
                "displayName": "Operation",
                "name": "operation",
                "type": "options",
                "options": [
                    {"name": "Create Task", "value": "create", "description": "Create a new task in the system"},
                    {"name": "Update Task", "value": "update", "description": "Update an existing task"},
                    {"name": "Delete Task", "value": "delete", "description": "Delete a task from the system"},
                    {"name": "Get Task", "value": "get", "description": "Retrieve a specific task"},
                    {"name": "List Tasks", "value": "list", "description": "Get a list of tasks with filters"}
                ],
                "default": "create",
                "required": true,
                "description": "The task operation to perform"
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
                "placeholder": "{{variable.task_id}} or enter UUID",
                "description": "The unique identifier of the task (can use workflow variables)"
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
                "placeholder": "Follow up with {{variable.lead_name}}",
                "validation": [
                    {
                        "type": "maxLength",
                        "properties": {
                            "maxLength": 255,
                            "errorMessage": "Title cannot exceed 255 characters"
                        }
                    }
                ],
                "description": "Task title (supports workflow variables)"
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
                "placeholder": "Call {{variable.lead_name}} at {{variable.lead_phone}} to discuss {{variable.lead_source}}",
                "description": "Detailed task description (supports workflow variables)"
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
                "displayName": "Due Date (Dynamic)",
                "name": "dueDateDynamic",
                "type": "options",
                "displayOptions": {
                    "show": {
                        "operation": ["create", "update"]
                    }
                },
                "options": [
                    {"name": "In 1 Hour", "value": "+1h"},
                    {"name": "In 4 Hours", "value": "+4h"},
                    {"name": "Tomorrow", "value": "+1d"},
                    {"name": "In 3 Days", "value": "+3d"},
                    {"name": "Next Week", "value": "+1w"},
                    {"name": "Custom", "value": "custom"}
                ],
                "description": "Set due date relative to current time"
            },
            {
                "displayName": "Status",
                "name": "status",
                "type": "options",
                "options": [
                    {"name": "Pending", "value": "pending"},
                    {"name": "In Progress", "value": "in_progress"},
                    {"name": "Completed", "value": "completed"},
                    {"name": "Cancelled", "value": "cancelled"},
                    {"name": "Expired", "value": "expired"}
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
                "displayName": "Priority",
                "name": "priority",
                "type": "options",
                "options": [
                    {"name": "Low", "value": "low"},
                    {"name": "Medium", "value": "medium"},
                    {"name": "High", "value": "high"},
                    {"name": "Urgent", "value": "urgent"}
                ],
                "default": "medium",
                "displayOptions": {
                    "show": {
                        "operation": ["create", "update"]
                    }
                },
                "description": "Task priority level"
            },
            {
                "displayName": "Entity Type",
                "name": "entityType",
                "type": "options",
                "options": [
                    {"name": "CRM Lead", "value": "crm_leads"},
                    {"name": "Contact", "value": "contacts"},
                    {"name": "Deal", "value": "deals"},
                    {"name": "Account", "value": "accounts"}
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
                "displayName": "Entity ID",
                "name": "entityId",
                "type": "string",
                "displayOptions": {
                    "show": {
                        "operation": ["create", "update"]
                    }
                },
                "placeholder": "{{variable.lead_id}} or enter UUID",
                "description": "ID of the related entity (supports workflow variables)"
            }
        ]
    }'::jsonb,
    '{}'::jsonb,
    '{
        "task": {
            "operations": ["create", "update", "delete", "get", "list"],
            "displayName": "Task"
        }
    }'::jsonb,
    '{
        "fields": [
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
                    {"name": "Pending", "value": "pending"},
                    {"name": "In Progress", "value": "in_progress"},
                    {"name": "Completed", "value": "completed"},
                    {"name": "Cancelled", "value": "cancelled"},
                    {"name": "Expired", "value": "expired"}
                ],
                "operators": ["equals", "not_equals", "in", "not_in"]
            },
            {
                "displayName": "Priority",
                "name": "priority",
                "type": "options",
                "options": [
                    {"name": "Low", "value": "low"},
                    {"name": "Medium", "value": "medium"},
                    {"name": "High", "value": "high"},
                    {"name": "Urgent", "value": "urgent"}
                ],
                "operators": ["equals", "not_equals", "in", "not_in"]
            },
            {
                "displayName": "Due Date",
                "name": "dueDate",
                "type": "dateTime",
                "operators": ["equals", "after", "before", "between", "is_empty", "is_not_empty"]
            }
        ]
    }'::jsonb,
    '{
        "create": {
            "success": true,
            "operation": "create",
            "data": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Follow up with John Doe",
                "description": "Call John Doe to discuss the proposal",
                "dueDate": "2024-01-20T14:00:00Z",
                "status": "pending",
                "priority": "high",
                "entityType": "crm_leads",
                "entityId": "lead-123",
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-01-15T10:30:00Z"
            }
        },
        "update": {
            "success": true,
            "operation": "update",
            "data": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "completed",
                "updatedAt": "2024-01-16T15:45:00Z"
            }
        },
        "list": {
            "success": true,
            "operation": "list",
            "data": {
                "tasks": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Follow up with John Doe",
                        "status": "pending",
                        "priority": "high",
                        "dueDate": "2024-01-20T14:00:00Z"
                    }
                ],
                "total": 1,
                "limit": 50,
                "offset": 0
            }
        }
    }'::jsonb,
    '{
        "loadOptions": {
            "getUsers": "SELECT id, CONCAT(first_name, '' '', last_name) as name FROM users WHERE is_active = true ORDER BY name",
            "getEntities": "SELECT id, name FROM entities WHERE type = $1 ORDER BY name"
        }
    }'::jsonb
);

COMMIT; 