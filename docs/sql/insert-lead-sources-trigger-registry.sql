-- Insert Lead Sources Database Change Trigger Registry
INSERT INTO workflow_trigger_registry (
    key,
    name,
    display_name,
    description,
    category,
    event_source,
    version,
    is_active,
    properties_schema,
    filter_schema,
    sample_payload,
    webhook_config,
    available_variables
) VALUES (
    'lead_sources_db_change',
    'leadSourcesDbChange',
    'Lead Sources Database Change',
    'Triggers when lead sources table data changes (INSERT, UPDATE, DELETE)',
    'database',
    'debezium',
    1,
    true,
    '{
        "properties": [
            {
                "displayName": "Table",
                "name": "table",
                "type": "options",
                "options": [{"name": "Lead Sources", "value": "lead_sources"}],
                "default": "lead_sources",
                "required": true,
                "description": "Database table to monitor"
            },
            {
                "displayName": "Operations",
                "name": "operations",
                "type": "multiOptions",
                "options": [
                    {"name": "Insert (New Record)", "value": "INSERT", "description": "Trigger when new lead source is created"},
                    {"name": "Update (Record Modified)", "value": "UPDATE", "description": "Trigger when lead source is modified"},
                    {"name": "Delete (Record Removed)", "value": "DELETE", "description": "Trigger when lead source is deleted"}
                ],
                "default": ["INSERT", "UPDATE"],
                "required": true,
                "description": "Which database operations should trigger the workflow"
            },
            {
                "displayName": "Monitor Specific Columns",
                "name": "monitor_columns",
                "type": "boolean",
                "default": false,
                "description": "Enable to monitor specific columns for changes"
            },
            {
                "displayName": "Columns to Monitor",
                "name": "columns",
                "type": "multiOptions",
                "displayOptions": {
                    "show": {
                        "monitor_columns": [true],
                        "operations": ["UPDATE"]
                    }
                },
                "options": [
                    {"name": "Code", "value": "code", "description": "Primary key - lead source code"},
                    {"name": "Name", "value": "name", "description": "Display name of the lead source"},
                    {"name": "Is Active", "value": "is_active", "description": "Whether the lead source is active"},
                    {"name": "Display Order", "value": "display_order", "description": "Sort order for display"}
                ],
                "description": "Only trigger when these specific columns change (UPDATE operations only)"
            }
        ]
    }'::jsonb,
    '{
        "fields": [
        {
            "displayName": "Operation Type",
            "name": "operation",
            "type": "options",
            "options": [
                {"name": "Insert", "value": "INSERT"},
                {"name": "Update", "value": "UPDATE"},
                {"name": "Delete", "value": "DELETE"}
            ]
        },
        {
            "displayName": "Lead Source Code",
            "name": "after.code",
            "type": "string",
            "description": "Filter by lead source code"
        },
        {
            "displayName": "Lead Source Name",
            "name": "after.name",
            "type": "string",
            "description": "Filter by lead source name"
        },
        {
            "displayName": "Is Active",
            "name": "after.is_active",
            "type": "boolean",
            "description": "Filter by active status"
        },
        {
            "displayName": "Display Order",
            "name": "after.display_order",
            "type": "number",
            "description": "Filter by display order"
        },
        {
            "displayName": "Previous Value - Code",
            "name": "before.code",
            "type": "string",
            "description": "Filter by previous code value (UPDATE/DELETE only)",
            "displayOptions": {
                "show": {
                    "operation": ["UPDATE", "DELETE"]
                }
            }
        },
        {
            "displayName": "Previous Value - Name",
            "name": "before.name",
            "type": "string",
            "description": "Filter by previous name value (UPDATE/DELETE only)",
            "displayOptions": {
                "show": {
                    "operation": ["UPDATE", "DELETE"]
                }
            }
        },
        {
            "displayName": "Previous Value - Is Active",
            "name": "before.is_active",
            "type": "boolean",
            "description": "Filter by previous active status (UPDATE/DELETE only)",
            "displayOptions": {
                "show": {
                    "operation": ["UPDATE", "DELETE"]
                }
            }
        }
    ]
    }'::jsonb,
    '{
        "INSERT": {
            "operation": "INSERT",
            "table": "lead_sources",
            "timestamp": "2024-01-15T10:30:00Z",
            "before": null,
            "after": {
                "code": "WEB_FORM",
                "name": "Website Contact Form",
                "is_active": true,
                "display_order": 10
            },
            "changed_columns": null
        },
        "UPDATE": {
            "operation": "UPDATE",
            "table": "lead_sources",
            "timestamp": "2024-01-15T11:45:00Z",
            "before": {
                "code": "WEB_FORM",
                "name": "Website Form",
                "is_active": true,
                "display_order": 10
            },
            "after": {
                "code": "WEB_FORM",
                "name": "Website Contact Form",
                "is_active": false,
                "display_order": 5
            },
            "changed_columns": ["name", "is_active", "display_order"]
        },
        "DELETE": {
            "operation": "DELETE",
            "table": "lead_sources",
            "timestamp": "2024-01-15T12:00:00Z",
            "before": {
                "code": "OLD_SOURCE",
                "name": "Deprecated Source",
                "is_active": false,
                "display_order": 999
            },
            "after": null,
            "changed_columns": null
        }
    }'::jsonb,
    '{}'::jsonb,
    '{
        "operation": {
            "type": "string",
            "description": "Database operation performed",
            "example": "INSERT",
            "path": "{{variable.operation}}"
        },
        "table": {
            "type": "string",
            "description": "Name of the affected table",
            "example": "lead_sources",
            "path": "{{variable.table}}"
        },
        "timestamp": {
            "type": "string",
            "description": "When the change occurred",
            "example": "2024-01-15T10:30:00Z",
            "path": "{{variable.timestamp}}"
        },
        "before": {
            "type": "object",
            "description": "Previous values (UPDATE/DELETE operations)",
            "properties": {
                "code": {"type": "string", "path": "{{variable.before.code}}"},
                "name": {"type": "string", "path": "{{variable.before.name}}"},
                "is_active": {"type": "boolean", "path": "{{variable.before.is_active}}"},
                "display_order": {"type": "number", "path": "{{variable.before.display_order}}"}
            }
        },
        "after": {
            "type": "object",
            "description": "New values (INSERT/UPDATE operations)",
            "properties": {
                "code": {"type": "string", "path": "{{variable.after.code}}"},
                "name": {"type": "string", "path": "{{variable.after.name}}"},
                "is_active": {"type": "boolean", "path": "{{variable.after.is_active}}"},
                "display_order": {"type": "number", "path": "{{variable.after.display_order}}"}
            }
        },
        "changed_columns": {
            "type": "array",
            "description": "List of columns that changed (UPDATE operations)",
            "example": ["name", "is_active"],
            "path": "{{variable.changed_columns}}"
        }
    }'::jsonb
);

COMMIT; 