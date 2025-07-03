-- -------------------------------------------------------------
-- TablePlus 6.6.5(626)
--
-- https://tableplus.com/
--
-- Database: mydb
-- Generation Time: 2025-07-01 22:33:16.5830
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."workflow_trigger_registry";
-- Table Definition
CREATE TABLE "public"."workflow_trigger_registry" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "key" text NOT NULL,
    "name" text NOT NULL,
    "display_name" text,
    "description" text,
    "category" text,
    "event_source" text,
    "version" int4 NOT NULL DEFAULT 1,
    "properties_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "filter_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "sample_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "webhook_config" jsonb DEFAULT '{}'::jsonb,
    "available_variables" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."workflow_action_registry";
-- Table Definition
CREATE TABLE "public"."workflow_action_registry" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "key" text NOT NULL,
    "name" text NOT NULL,
    "display_name" text,
    "description" text,
    "category" text,
    "icon" text,
    "icon_color" text,
    "documentation_url" text,
    "version" int4 NOT NULL DEFAULT 1,
    "is_active" bool NOT NULL DEFAULT true,
    "properties_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "credentials_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "operation_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "filter_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "sample_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "execution_type" text,
    "methods" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "group" _text NOT NULL DEFAULT '{action}'::text[],
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."workflow_edge";
-- Table Definition
CREATE TABLE "public"."workflow_edge" (
    "from_step_id" uuid NOT NULL,
    "branch_key" text NOT NULL DEFAULT 'default'::text,
    "to_step_id" uuid,
    PRIMARY KEY ("from_step_id","branch_key")
);

DROP TABLE IF EXISTS "public"."workflow_version";
-- Table Definition
CREATE TABLE "public"."workflow_version" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "workflow_id" uuid NOT NULL,
    "version_num" int4 NOT NULL,
    "s3_key" text NOT NULL,
    "s3_etag" text,
    "inline_json" jsonb,
    "root_step_id" uuid,
    "editor_id" uuid,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."workflow_step";
-- Table Definition
CREATE TABLE "public"."workflow_step" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "kind" text NOT NULL,
    "cfg" jsonb,
    "name" text,
    "resource" text,
    "operation" text,
    "credential_id" uuid,
    "version_id" uuid NOT NULL,
    "action_key" text,
    "display_options" jsonb,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."workflow_subscription";
-- Table Definition
CREATE TABLE "public"."workflow_subscription" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "workflow_id" uuid NOT NULL,
    "trigger_key" text NOT NULL,
    "filter_conditions" jsonb,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."workflow_definition";
-- Table Definition
CREATE TABLE "public"."workflow_definition" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "segment" text,
    "is_active" bool NOT NULL DEFAULT true,
    "created_by" uuid,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "latest_ver_id" uuid,
    "description" text,
    "category" text,
    "tags" text,
    "is_template" bool NOT NULL DEFAULT false,
    "pinned" bool NOT NULL DEFAULT false,
    "updated_by" uuid,
    PRIMARY KEY ("id")
);

INSERT INTO "public"."workflow_trigger_registry" ("id", "key", "name", "display_name", "description", "category", "event_source", "version", "properties_schema", "filter_schema", "sample_payload", "webhook_config", "available_variables", "is_active", "created_at", "updated_at") VALUES
('9dfba030-fa1a-4f5c-a155-aa40d79d72a1', 'lead_sources_db_change', 'leadSourcesDbChange', 'Lead Sources Database Change', 'Triggers when lead sources table data changes (INSERT, UPDATE, DELETE)', 'database', 'debezium', 1, '{"properties": [{"name": "table", "type": "options", "default": "lead_sources", "options": [{"name": "Lead Sources", "value": "lead_sources"}], "required": true, "description": "Database table to monitor", "displayName": "Table"}, {"name": "operations", "type": "multiOptions", "default": ["INSERT", "UPDATE"], "options": [{"name": "Insert (New Record)", "value": "INSERT", "description": "Trigger when new lead source is created"}, {"name": "Update (Record Modified)", "value": "UPDATE", "description": "Trigger when lead source is modified"}, {"name": "Delete (Record Removed)", "value": "DELETE", "description": "Trigger when lead source is deleted"}], "required": true, "description": "Which database operations should trigger the workflow", "displayName": "Operations"}, {"name": "monitor_columns", "type": "boolean", "default": false, "description": "Enable to monitor specific columns for changes", "displayName": "Monitor Specific Columns"}, {"name": "columns", "type": "multiOptions", "options": [{"name": "Code", "value": "code", "description": "Primary key - lead source code"}, {"name": "Name", "value": "name", "description": "Display name of the lead source"}, {"name": "Is Active", "value": "is_active", "description": "Whether the lead source is active"}, {"name": "Display Order", "value": "display_order", "description": "Sort order for display"}], "description": "Only trigger when these specific columns change (UPDATE operations only)", "displayName": "Columns to Monitor", "displayOptions": {"show": {"operations": ["UPDATE"], "monitor_columns": [true]}}}]}', '{"fields": [{"name": "operation", "type": "options", "options": [{"name": "Insert", "value": "INSERT"}, {"name": "Update", "value": "UPDATE"}, {"name": "Delete", "value": "DELETE"}], "displayName": "Operation Type"}, {"name": "after.code", "type": "string", "description": "Filter by lead source code", "displayName": "Lead Source Code"}, {"name": "after.name", "type": "string", "description": "Filter by lead source name", "displayName": "Lead Source Name"}, {"name": "after.is_active", "type": "boolean", "description": "Filter by active status", "displayName": "Is Active"}, {"name": "after.display_order", "type": "number", "description": "Filter by display order", "displayName": "Display Order"}, {"name": "before.code", "type": "string", "description": "Filter by previous code value (UPDATE/DELETE only)", "displayName": "Previous Value - Code", "displayOptions": {"show": {"operation": ["UPDATE", "DELETE"]}}}, {"name": "before.name", "type": "string", "description": "Filter by previous name value (UPDATE/DELETE only)", "displayName": "Previous Value - Name", "displayOptions": {"show": {"operation": ["UPDATE", "DELETE"]}}}, {"name": "before.is_active", "type": "boolean", "description": "Filter by previous active status (UPDATE/DELETE only)", "displayName": "Previous Value - Is Active", "displayOptions": {"show": {"operation": ["UPDATE", "DELETE"]}}}]}', '{"DELETE": {"after": null, "table": "lead_sources", "before": {"code": "OLD_SOURCE", "name": "Deprecated Source", "is_active": false, "display_order": 999}, "operation": "DELETE", "timestamp": "2024-01-15T12:00:00Z", "changed_columns": null}, "INSERT": {"after": {"code": "WEB_FORM", "name": "Website Contact Form", "is_active": true, "display_order": 10}, "table": "lead_sources", "before": null, "operation": "INSERT", "timestamp": "2024-01-15T10:30:00Z", "changed_columns": null}, "UPDATE": {"after": {"code": "WEB_FORM", "name": "Website Contact Form", "is_active": false, "display_order": 5}, "table": "lead_sources", "before": {"code": "WEB_FORM", "name": "Website Form", "is_active": true, "display_order": 10}, "operation": "UPDATE", "timestamp": "2024-01-15T11:45:00Z", "changed_columns": ["name", "is_active", "display_order"]}}', NULL, '{"after": {"type": "object", "properties": {"code": {"path": "{{variable.after.code}}", "type": "string"}, "name": {"path": "{{variable.after.name}}", "type": "string"}, "is_active": {"path": "{{variable.after.is_active}}", "type": "boolean"}, "display_order": {"path": "{{variable.after.display_order}}", "type": "number"}}, "description": "New values (INSERT/UPDATE operations)"}, "table": {"path": "{{variable.table}}", "type": "string", "example": "lead_sources", "description": "Name of the affected table"}, "before": {"type": "object", "properties": {"code": {"path": "{{variable.before.code}}", "type": "string"}, "name": {"path": "{{variable.before.name}}", "type": "string"}, "is_active": {"path": "{{variable.before.is_active}}", "type": "boolean"}, "display_order": {"path": "{{variable.before.display_order}}", "type": "number"}}, "description": "Previous values (UPDATE/DELETE operations)"}, "operation": {"path": "{{variable.operation}}", "type": "string", "example": "INSERT", "description": "Database operation performed"}, "timestamp": {"path": "{{variable.timestamp}}", "type": "string", "example": "2024-01-15T10:30:00Z", "description": "When the change occurred"}, "changed_columns": {"path": "{{variable.changed_columns}}", "type": "array", "example": ["name", "is_active"], "description": "List of columns that changed (UPDATE operations)"}}', 't', '2025-06-27 18:16:32.678168', '2025-06-27 18:16:32.678168');

INSERT INTO "public"."workflow_action_registry" ("id", "key", "name", "display_name", "description", "category", "icon", "icon_color", "documentation_url", "version", "is_active", "properties_schema", "credentials_schema", "operation_schema", "filter_schema", "sample_payload", "created_at", "updated_at", "execution_type", "methods", "group") VALUES
('8f9e8860-3ddf-48c3-9a5d-386fdd405d61', 'task_management', 'taskManagement', 'Task Management', 'Create, update, delete and manage tasks in the system based on incoming workflow data', 'internal', 'fas:tasks', '#4F46E5', '/docs/actions/task-management', 1, 't', '{"properties": [{"name": "operation", "type": "options", "default": "create", "options": [{"name": "Create Task", "value": "create", "description": "Create a new task in the system"}, {"name": "Update Task", "value": "update", "description": "Update an existing task"}, {"name": "Delete Task", "value": "delete", "description": "Delete a task from the system"}, {"name": "Get Task", "value": "get", "description": "Retrieve a specific task"}, {"name": "List Tasks", "value": "list", "description": "Get a list of tasks with filters"}], "required": true, "description": "The task operation to perform", "displayName": "Operation"}, {"name": "taskId", "type": "string", "required": true, "description": "The unique identifier of the task (can use workflow variables)", "displayName": "Task ID", "placeholder": "{{variable.task_id}} or enter UUID", "displayOptions": {"show": {"operation": ["update", "delete", "get"]}}}, {"name": "title", "type": "string", "required": true, "validation": [{"type": "maxLength", "properties": {"maxLength": 255, "errorMessage": "Title cannot exceed 255 characters"}}], "description": "Task title (supports workflow variables)", "displayName": "Title", "placeholder": "Follow up with {{variable.lead_name}}", "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "description", "type": "string", "description": "Detailed task description (supports workflow variables)", "displayName": "Description", "placeholder": "Call {{variable.lead_name}} at {{variable.lead_phone}} to discuss {{variable.lead_source}}", "typeOptions": {"rows": 4}, "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "dueDate", "type": "dateTime", "description": "When the task should be completed", "displayName": "Due Date", "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "dueDateDynamic", "type": "options", "options": [{"name": "In 1 Hour", "value": "+1h"}, {"name": "In 4 Hours", "value": "+4h"}, {"name": "Tomorrow", "value": "+1d"}, {"name": "In 3 Days", "value": "+3d"}, {"name": "Next Week", "value": "+1w"}, {"name": "Custom", "value": "custom"}], "description": "Set due date relative to current time", "displayName": "Due Date (Dynamic)", "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "status", "type": "options", "default": "pending", "options": [{"name": "Pending", "value": "pending"}, {"name": "In Progress", "value": "in_progress"}, {"name": "Completed", "value": "completed"}, {"name": "Cancelled", "value": "cancelled"}, {"name": "Expired", "value": "expired"}], "description": "Current status of the task", "displayName": "Status", "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "priority", "type": "options", "default": "medium", "options": [{"name": "Low", "value": "low"}, {"name": "Medium", "value": "medium"}, {"name": "High", "value": "high"}, {"name": "Urgent", "value": "urgent"}], "description": "Task priority level", "displayName": "Priority", "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "entityType", "type": "options", "default": "crm_leads", "options": [{"name": "CRM Lead", "value": "crm_leads"}, {"name": "Contact", "value": "contacts"}, {"name": "Deal", "value": "deals"}, {"name": "Account", "value": "accounts"}], "description": "Type of entity this task is related to", "displayName": "Entity Type", "displayOptions": {"show": {"operation": ["create", "update"]}}}, {"name": "entityId", "type": "string", "description": "ID of the related entity (supports workflow variables)", "displayName": "Entity ID", "placeholder": "{{variable.lead_id}} or enter UUID", "displayOptions": {"show": {"operation": ["create", "update"]}}}]}', '{}', '{"task": {"operations": ["create", "update", "delete", "get", "list"], "displayName": "Task"}}', '{"fields": [{"name": "title", "type": "string", "operators": ["equals", "not_equals", "contains", "starts_with", "ends_with", "is_empty", "is_not_empty"], "displayName": "Title"}, {"name": "status", "type": "options", "options": [{"name": "Pending", "value": "pending"}, {"name": "In Progress", "value": "in_progress"}, {"name": "Completed", "value": "completed"}, {"name": "Cancelled", "value": "cancelled"}, {"name": "Expired", "value": "expired"}], "operators": ["equals", "not_equals", "in", "not_in"], "displayName": "Status"}, {"name": "priority", "type": "options", "options": [{"name": "Low", "value": "low"}, {"name": "Medium", "value": "medium"}, {"name": "High", "value": "high"}, {"name": "Urgent", "value": "urgent"}], "operators": ["equals", "not_equals", "in", "not_in"], "displayName": "Priority"}, {"name": "dueDate", "type": "dateTime", "operators": ["equals", "after", "before", "between", "is_empty", "is_not_empty"], "displayName": "Due Date"}]}', '{"list": {"data": {"limit": 50, "tasks": [{"id": "123e4567-e89b-12d3-a456-426614174000", "title": "Follow up with John Doe", "status": "pending", "dueDate": "2024-01-20T14:00:00Z", "priority": "high"}], "total": 1, "offset": 0}, "success": true, "operation": "list"}, "create": {"data": {"id": "123e4567-e89b-12d3-a456-426614174000", "title": "Follow up with John Doe", "status": "pending", "dueDate": "2024-01-20T14:00:00Z", "entityId": "lead-123", "priority": "high", "createdAt": "2024-01-15T10:30:00Z", "updatedAt": "2024-01-15T10:30:00Z", "entityType": "crm_leads", "description": "Call John Doe to discuss the proposal"}, "success": true, "operation": "create"}, "update": {"data": {"id": "123e4567-e89b-12d3-a456-426614174000", "status": "completed", "updatedAt": "2024-01-16T15:45:00Z"}, "success": true, "operation": "update"}}', '2025-06-27 18:24:22.905281', '2025-06-27 18:24:22.905281', 'internal_function', '{"loadOptions": {"getUsers": "SELECT id, CONCAT(first_name, '' '', last_name) as name FROM users WHERE is_active = true ORDER BY name", "getEntities": "SELECT id, name FROM entities WHERE type = $1 ORDER BY name"}}', '{action}');

INSERT INTO "public"."workflow_version" ("id", "workflow_id", "version_num", "s3_key", "s3_etag", "inline_json", "root_step_id", "editor_id", "created_at", "updated_at") VALUES
('83c96de2-df4d-490e-b7c6-cf29b4b51679', 'a77d0327-0f78-4612-912e-1186be87d686', 1, 's3://workflows/a77d0327-0f78-4612-912e-1186be87d686/v1.json', NULL, '{"name": "Lead Source Activation Workflow", "edges": [], "steps": [{"kind": "ACTION", "name": "create_setup_task", "actionKey": "task_management", "configuration": {"resource": "task", "operation": "create", "parameters": {"title": "Setup marketing campaign for {{variable.after.name}}", "status": "pending", "entityId": "{{variable.after.code}}", "priority": "high", "operation": "create", "entityType": "crm_leads", "description": "Lead source ''{{variable.after.name}}'' ({{variable.after.code}}) has been activated.\n\nRequired actions:\n1. Set up tracking codes\n2. Configure lead routing\n3. Create marketing materials\n4. Test lead capture forms\n5. Notify sales team\n\nLead Source Details:\n- Code: {{variable.after.code}}\n- Name: {{variable.after.name}}\n- Display Order: {{variable.after.display_order}}\n- Activated: {{variable.timestamp}}", "additionalData": {"activation_date": "{{variable.timestamp}}", "previous_status": "{{variable.before.is_active}}", "lead_source_code": "{{variable.after.code}}", "lead_source_name": "{{variable.after.name}}", "workflow_trigger": "lead_source_activation"}, "dueDateDynamic": "+1d"}}}], "segment": "MARKETING", "trigger": {"filters": {"combinator": "AND", "conditions": [{"type": "string", "value": "UPDATE", "operator": "equals", "variable": "{{variable.operation}}"}, {"type": "boolean", "value": true, "operator": "equals", "variable": "{{variable.after.is_active}}"}, {"type": "boolean", "value": false, "operator": "equals", "variable": "{{variable.before.is_active}}"}]}, "properties": {"table_name": "lead_sources", "change_type": ["UPDATE"], "monitor_fields": ["is_active", "name", "code", "display_order"]}, "triggerKey": "lead_sources_db_change"}, "version": "1.0", "createdAt": "2025-06-27T18:43:59.989Z", "description": "Automatically create setup tasks when lead sources are activated"}', 'ab2aa752-e8f1-461b-bfa5-b36329b42c7b', '9dfba030-fa1a-4f5c-a155-aa40d79d72a5', '2025-06-27 18:43:59.95207', '2025-06-27 18:43:59.95207');

INSERT INTO "public"."workflow_step" ("id", "kind", "cfg", "name", "resource", "operation", "credential_id", "version_id", "action_key", "display_options") VALUES
('ab2aa752-e8f1-461b-bfa5-b36329b42c7b', 'ACTION', '{"title": "Setup marketing campaign for {{variable.after.name}}", "status": "pending", "entityId": "{{variable.after.code}}", "priority": "high", "operation": "create", "entityType": "crm_leads", "description": "Lead source ''{{variable.after.name}}'' ({{variable.after.code}}) has been activated.\n\nRequired actions:\n1. Set up tracking codes\n2. Configure lead routing\n3. Create marketing materials\n4. Test lead capture forms\n5. Notify sales team\n\nLead Source Details:\n- Code: {{variable.after.code}}\n- Name: {{variable.after.name}}\n- Display Order: {{variable.after.display_order}}\n- Activated: {{variable.timestamp}}", "additionalData": {"activation_date": "{{variable.timestamp}}", "previous_status": "{{variable.before.is_active}}", "lead_source_code": "{{variable.after.code}}", "lead_source_name": "{{variable.after.name}}", "workflow_trigger": "lead_source_activation"}, "dueDateDynamic": "+1d"}', 'create_setup_task', 'task', 'create', NULL, '83c96de2-df4d-490e-b7c6-cf29b4b51679', 'task_management', NULL);

INSERT INTO "public"."workflow_subscription" ("id", "workflow_id", "trigger_key", "filter_conditions", "is_active", "created_at", "updated_at") VALUES
('a022ea87-62a5-4975-a9ab-0adaf4af23a7', 'a77d0327-0f78-4612-912e-1186be87d686', 'lead_sources_db_change', '{"combinator": "AND", "conditions": [{"type": "string", "value": "UPDATE", "operator": "equals", "variable": "{{variable.operation}}"}, {"type": "boolean", "value": true, "operator": "equals", "variable": "{{variable.after.is_active}}"}, {"type": "boolean", "value": false, "operator": "equals", "variable": "{{variable.before.is_active}}"}]}', 't', '2025-06-27 18:43:59.95207', '2025-06-27 18:43:59.95207');

INSERT INTO "public"."workflow_definition" ("id", "name", "segment", "is_active", "created_by", "created_at", "updated_at", "latest_ver_id", "description", "category", "tags", "is_template", "pinned", "updated_by") VALUES
('a77d0327-0f78-4612-912e-1186be87d686', 'Lead Source Activation Workflow', 'MARKETING', 't', '9dfba030-fa1a-4f5c-a155-aa40d79d72a5', '2025-06-27 18:43:59.95207', '2025-06-27 18:43:59.95207', '83c96de2-df4d-490e-b7c6-cf29b4b51679', NULL, NULL, NULL, 'f', 'f', NULL);



-- Indices
CREATE UNIQUE INDEX "PK_5e693d0d0736e560bfdfa5ade0b" ON public.workflow_trigger_registry USING btree (id);
CREATE UNIQUE INDEX "UQ_9b56695119bf02104059bfdcd19" ON public.workflow_trigger_registry USING btree (key);
CREATE INDEX idx_workflow_trigger_registry_key ON public.workflow_trigger_registry USING btree (key);


-- Indices
CREATE UNIQUE INDEX "PK_f8f40f755707831c5c2f67ddbd7" ON public.workflow_action_registry USING btree (id);
CREATE UNIQUE INDEX "UQ_0e07a15d5eee1b2e7908b5f0790" ON public.workflow_action_registry USING btree (key);
CREATE INDEX idx_workflow_action_registry_key ON public.workflow_action_registry USING btree (key);
ALTER TABLE "public"."workflow_edge" ADD FOREIGN KEY ("from_step_id") REFERENCES "public"."workflow_step"("id");
ALTER TABLE "public"."workflow_edge" ADD FOREIGN KEY ("to_step_id") REFERENCES "public"."workflow_step"("id");


-- Indices
CREATE UNIQUE INDEX "PK_3d665fa2a61717910e9481b5331" ON public.workflow_edge USING btree (from_step_id, branch_key);
CREATE INDEX idx_workflow_edge_from_step ON public.workflow_edge USING btree (from_step_id);
ALTER TABLE "public"."workflow_version" ADD FOREIGN KEY ("root_step_id") REFERENCES "public"."workflow_step"("id");


-- Indices
CREATE UNIQUE INDEX "PK_e61d12662fd18f475bba2e86b7d" ON public.workflow_version USING btree (id);
CREATE INDEX idx_workflow_version_key ON public.workflow_version USING btree (workflow_id, version_num);
ALTER TABLE "public"."workflow_step" ADD FOREIGN KEY ("credential_id") REFERENCES "public"."user_credentials"("id");


-- Indices
CREATE UNIQUE INDEX "PK_6c155e8aa140495dbf88eae4f4a" ON public.workflow_step USING btree (id);
ALTER TABLE "public"."workflow_subscription" ADD FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_definition"("id");
ALTER TABLE "public"."workflow_subscription" ADD FOREIGN KEY ("trigger_key") REFERENCES "public"."workflow_trigger_registry"("key");


-- Indices
CREATE UNIQUE INDEX "PK_a4d8e82383770ef8fe631472857" ON public.workflow_subscription USING btree (id);
CREATE INDEX idx_workflow_subscription_workflow ON public.workflow_subscription USING btree (workflow_id);
CREATE INDEX idx_workflow_subscription_trigger ON public.workflow_subscription USING btree (trigger_key);
ALTER TABLE "public"."workflow_definition" ADD FOREIGN KEY ("latest_ver_id") REFERENCES "public"."workflow_version"("id");


-- Indices
CREATE UNIQUE INDEX "PK_85af8b533afa5d71f1ea9663ad3" ON public.workflow_definition USING btree (id);
CREATE UNIQUE INDEX "REL_48585f330830b1a2c69ee70a36" ON public.workflow_definition USING btree (latest_ver_id);
CREATE INDEX idx_workflow_definition_key ON public.workflow_definition USING btree (id);
CREATE INDEX idx_workflow_definition_category ON public.workflow_definition USING btree (category);
CREATE INDEX idx_workflow_definition_active ON public.workflow_definition USING btree (is_active);
