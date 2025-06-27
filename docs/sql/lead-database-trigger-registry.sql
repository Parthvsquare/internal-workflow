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
  available_variables,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'lead_database_change',
  'Lead Database Change',
  'Trigger when lead records are modified in the database (CDC)',
  'Database',
  'debezium',
  1,
  true,
  '[
    {
      "displayName": "Table Name",
      "name": "table_name",
      "type": "options",
      "options": [
        { "name": "Leads", "value": "leads" },
        { "name": "CRM Leads", "value": "crm_leads" }
      ],
      "default": "leads",
      "required": true,
      "description": "Database table to monitor for changes"
    },
    {
      "displayName": "Change Type",
      "name": "change_type",
      "type": "multiOptions",
      "options": [
        { "name": "Insert", "value": "INSERT" },
        { "name": "Update", "value": "UPDATE" },
        { "name": "Delete", "value": "DELETE" }
      ],
      "default": ["INSERT", "UPDATE"],
      "required": true,
      "description": "Types of database changes to monitor"
    },
    {
      "displayName": "Monitor Specific Fields",
      "name": "monitor_fields",
      "type": "multiOptions",
      "options": [
        { "name": "Status", "value": "status" },
        { "name": "Assigned To", "value": "assigned_to" },
        { "name": "Lead Source", "value": "source" },
        { "name": "Lead Score", "value": "lead_score" },
        { "name": "Contact Information", "value": "contact_info" }
      ],
      "default": ["status"],
      "description": "Only trigger when these specific fields change (for UPDATE operations)"
    },
    {
      "displayName": "Status Change Detection",
      "name": "status_change_only",
      "type": "boolean",
      "default": true,
      "description": "Only trigger when status field actually changes value"
    },
    {
      "displayName": "Debezium Configuration",
      "name": "debezium_config",
      "type": "collection",
      "default": {},
      "options": [
        {
          "displayName": "Connector Name",
          "name": "connector_name",
          "type": "string",
          "default": "leads-connector",
          "description": "Name of the Debezium connector"
        },
        {
          "displayName": "Topic Pattern",
          "name": "topic_pattern",
          "type": "string",
          "default": "dbserver1.public.leads",
          "description": "Kafka topic pattern to subscribe to"
        },
        {
          "displayName": "Consumer Group",
          "name": "consumer_group",
          "type": "string",
          "default": "workflow-engine",
          "description": "Kafka consumer group ID"
        }
      ]
    }
  ]'::jsonb,
  '[
    {
      "displayName": "New Status",
      "name": "after_status",
      "type": "options",
      "dataSource": {
        "type": "database",
        "table": "lead_statuses",
        "valueColumn": "code",
        "labelColumn": "name",
        "whereClause": "is_active = true",
        "orderBy": "sort_order ASC",
        "cache": true,
        "cacheTtl": 1800
      },
      "operators": ["equals", "not_equals", "in", "not_in"]
    },
    {
      "displayName": "Previous Status",
      "name": "before_status",
      "type": "options",
      "dataSource": {
        "type": "database",
        "table": "lead_statuses",
        "valueColumn": "code",
        "labelColumn": "name",
        "whereClause": "is_active = true",
        "orderBy": "sort_order ASC",
        "cache": true,
        "cacheTtl": 1800
      },
      "operators": ["equals", "not_equals", "in", "not_in", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "New Assigned To",
      "name": "after_assigned_to",
      "type": "options",
      "dataSource": {
        "type": "database",
        "table": "users",
        "valueColumn": "id",
        "labelColumn": "full_name",
        "whereClause": "is_active = true AND role IN (''sales_rep'', ''sales_manager'')",
        "orderBy": "full_name ASC",
        "cache": true,
        "cacheTtl": 600
      },
      "operators": ["equals", "not_equals", "in", "not_in", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "Previous Assigned To",
      "name": "before_assigned_to",
      "type": "options",
      "dataSource": {
        "type": "database",
        "table": "users",
        "valueColumn": "id",
        "labelColumn": "full_name",
        "whereClause": "is_active = true",
        "orderBy": "full_name ASC",
        "cache": true,
        "cacheTtl": 600
      },
      "operators": ["equals", "not_equals", "in", "not_in", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "Lead Source",
      "name": "after_source",
      "type": "options",
      "dataSource": {
        "type": "database",
        "table": "lead_sources",
        "valueColumn": "code",
        "labelColumn": "name",
        "whereClause": "is_active = true",
        "orderBy": "display_order ASC",
        "cache": true,
        "cacheTtl": 1800
      },
      "operators": ["equals", "not_equals", "in", "not_in"]
    },
    {
      "displayName": "Change Operation",
      "name": "operation_type",
      "type": "options",
      "options": [
        { "name": "Insert", "value": "INSERT" },
        { "name": "Update", "value": "UPDATE" },
        { "name": "Delete", "value": "DELETE" }
      ],
      "operators": ["equals", "not_equals", "in", "not_in"]
    },
    {
      "displayName": "Lead Name",
      "name": "after_name",
      "type": "string",
      "operators": ["equals", "not_equals", "contains", "starts_with", "ends_with", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "Lead Email",
      "name": "after_email",
      "type": "string",
      "operators": ["equals", "not_equals", "contains", "starts_with", "ends_with", "is_empty", "is_not_empty"]
    },
    {
      "displayName": "Lead Score Change",
      "name": "lead_score_delta",
      "type": "number",
      "operators": ["equals", "greater_than", "less_than", "between"]
    },
    {
      "displayName": "Timestamp",
      "name": "event_timestamp",
      "type": "dateTime",
      "operators": ["equals", "after", "before", "between"]
    }
  ]'::jsonb,
  '{
    "operation": "UPDATE",
    "table": "leads",
    "transaction_id": "12345",
    "event_timestamp": "2024-01-15T10:30:00.123Z",
    "before": {
      "id": "lead_12345",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "company": "Acme Corporation",
      "status": "new",
      "assigned_to": null,
      "source": "website",
      "lead_score": 75,
      "date_created": "2024-01-15T09:00:00Z",
      "date_last_updated": "2024-01-15T09:00:00Z"
    },
    "after": {
      "id": "lead_12345",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "company": "Acme Corporation",
      "status": "contacted",
      "assigned_to": "sales_rep_456",
      "source": "website",
      "lead_score": 85,
      "date_created": "2024-01-15T09:00:00Z",
      "date_last_updated": "2024-01-15T10:30:00Z"
    },
    "changed_fields": ["status", "assigned_to", "lead_score", "date_last_updated"],
    "metadata": {
      "connector": "leads-connector",
      "topic": "dbserver1.public.leads",
      "partition": 0,
      "offset": 1234567,
      "key": "lead_12345"
    }
  }'::jsonb,
  '{
    "cdc_config": {
      "connector_type": "debezium-postgres",
      "polling_interval_ms": 1000,
      "max_batch_size": 1000,
      "heartbeat_interval_ms": 5000,
      "schema_include_list": "public",
      "table_include_list": "public.leads,public.crm_leads"
    },
    "kafka_config": {
      "bootstrap_servers": "kafka:9092",
      "auto_offset_reset": "latest",
      "enable_auto_commit": false,
      "session_timeout_ms": 30000
    }
  }'::jsonb,
  '{
    "before": {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "status": "string",
      "assigned_to": "string",
      "source": "string",
      "lead_score": "number",
      "date_created": "string",
      "date_last_updated": "string"
    },
    "after": {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "status": "string",
      "assigned_to": "string",
      "source": "string",
      "lead_score": "number",
      "date_created": "string",
      "date_last_updated": "string"
    },
    "operation": "string",
    "table": "string",
    "transaction_id": "string",
    "event_timestamp": "string",
    "changed_fields": "array",
    "metadata": "object"
  }'::jsonb,
  NOW(),
  NOW()
); 