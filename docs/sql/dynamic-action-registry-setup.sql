-- Dynamic Action Registry Setup
-- This file shows how to configure workflow actions that can be used by non-developers
-- without requiring code changes

-- 1. Task Management Action Registry
INSERT INTO workflow_action_registry (
  id,
  key,
  name,
  display_name,
  description,
  category,
  "group",
  icon,
  icon_color,
  execution_type,
  version,
  is_active,
  properties_schema,
  sample_payload,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'task_management',
  'Task Management',
  'Create & Manage Tasks',
  'Create, update, or delete tasks in the system. Supports dynamic due dates and entity linking.',
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
          {"name": "Update Task", "value": "update"},
          {"name": "Delete Task", "value": "delete"}
        ],
        "description": "What operation to perform on the task"
      },
      "title": {
        "displayName": "Task Title",
        "type": "string",
        "required": true,
        "placeholder": "Enter task title (supports variables: {{variable.after.name}})",
        "description": "The title of the task. You can use template variables."
      },
      "description": {
        "displayName": "Description",
        "type": "string",
        "typeOptions": {
          "rows": 4
        },
        "placeholder": "Task description with variables: {{variable.after.code}}",
        "description": "Detailed description of the task"
      },
      "status": {
        "displayName": "Status",
        "type": "options",
        "default": "pending",
        "options": [
          {"name": "Pending", "value": "pending"},
          {"name": "In Progress", "value": "in_progress"},
          {"name": "Completed", "value": "completed"},
          {"name": "Cancelled", "value": "cancelled"},
          {"name": "Expired", "value": "expired"}
        ]
      },
      "entityType": {
        "displayName": "Related Entity Type",
        "type": "options",
        "default": "crm_leads",
        "options": [
          {"name": "CRM Leads", "value": "crm_leads"}
        ],
        "description": "What type of entity this task is related to"
      },
      "entityId": {
        "displayName": "Entity ID",
        "type": "string",
        "placeholder": "{{variable.after.code}} or static ID",
        "description": "ID of the related entity (supports template variables)"
      },
      "dueDateDynamic": {
        "displayName": "Due Date (Dynamic)",
        "type": "string",
        "placeholder": "+1d, +2h, +30m",
        "description": "Relative due date from now. Examples: +1d (1 day), +2h (2 hours), +30m (30 minutes)"
      },
      "dueDate": {
        "displayName": "Due Date (Fixed)",
        "type": "dateTime",
        "description": "Fixed due date (overrides dynamic date if set)"
      },
      "priority": {
        "displayName": "Priority",
        "type": "options",
        "default": "medium",
        "options": [
          {"name": "Low", "value": "low"},
          {"name": "Medium", "value": "medium"},
          {"name": "High", "value": "high"},
          {"name": "Urgent", "value": "urgent"}
        ]
      },
      "additionalData": {
        "displayName": "Additional Data",
        "type": "json",
        "description": "Additional JSON data to store with the task"
      }
    }
  }',
  '{
    "operation": "create",
    "title": "Follow up with {{variable.after.name}}",
    "description": "New lead from {{variable.source}} needs follow up",
    "status": "pending",
    "entityType": "crm_leads",
    "entityId": "{{variable.after.id}}",
    "dueDateDynamic": "+1d",
    "priority": "high",
    "additionalData": {
      "source": "{{variable.source}}",
      "leadName": "{{variable.after.name}}"
    }
  }',
  NOW(),
  NOW()
);

-- 2. Email Notification Action Registry
INSERT INTO workflow_action_registry (
  id,
  key,
  name,
  display_name,
  description,
  category,
  "group",
  icon,
  icon_color,
  execution_type,
  version,
  is_active,
  properties_schema,
  sample_payload,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'send_email',
  'Send Email',
  'Email Notification',
  'Send email notifications to users or customers',
  'communication',
  ARRAY['action'],
  'mail',
  '#059669',
  'internal_function',
  1,
  true,
  '{
    "type": "object",
    "properties": {
      "to": {
        "displayName": "To Email",
        "type": "string",
        "required": true,
        "placeholder": "user@example.com or {{variable.after.email}}",
        "description": "Recipient email address (supports template variables)"
      },
      "subject": {
        "displayName": "Subject",
        "type": "string",
        "required": true,
        "placeholder": "Welcome {{variable.after.name}}!",
        "description": "Email subject line"
      },
      "body": {
        "displayName": "Email Body",
        "type": "string",
        "typeOptions": {
          "rows": 6
        },
        "placeholder": "Hello {{variable.after.name}}, welcome to our platform!",
        "description": "Email content (supports HTML and template variables)"
      },
      "template": {
        "displayName": "Email Template",
        "type": "options",
        "options": [
          {"name": "Welcome Email", "value": "welcome"},
          {"name": "Lead Notification", "value": "lead_notification"},
          {"name": "Task Reminder", "value": "task_reminder"},
          {"name": "Custom", "value": "custom"}
        ],
        "description": "Pre-defined email template to use"
      }
    }
  }',
  '{
    "to": "{{variable.after.email}}",
    "subject": "Welcome {{variable.after.name}}!",
    "body": "Hello {{variable.after.name}},\\n\\nWelcome to our platform! We are excited to have you.",
    "template": "welcome"
  }',
  NOW(),
  NOW()
);

-- 3. SMS Notification Action Registry  
INSERT INTO workflow_action_registry (
  id,
  key,
  name,
  display_name,
  description,
  category,
  "group",
  icon,
  icon_color,
  execution_type,
  version,
  is_active,
  properties_schema,
  sample_payload,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'send_sms',
  'Send SMS',
  'SMS Notification',
  'Send SMS notifications to mobile numbers',
  'communication',
  ARRAY['action'],
  'phone',
  '#DC2626',
  'internal_function',
  1,
  true,
  '{
    "type": "object",
    "properties": {
      "to": {
        "displayName": "Phone Number",
        "type": "string",
        "required": true,
        "placeholder": "+1234567890 or {{variable.after.phone}}",
        "description": "Recipient phone number with country code"
      },
      "message": {
        "displayName": "Message",
        "type": "string",
        "required": true,
        "typeOptions": {
          "rows": 3,
          "maxLength": 160
        },
        "placeholder": "Hello {{variable.after.name}}, your task is ready!",
        "description": "SMS message content (max 160 characters)"
      },
      "template": {
        "displayName": "SMS Template",
        "type": "options",
        "options": [
          {"name": "Welcome SMS", "value": "welcome"},
          {"name": "Task Reminder", "value": "task_reminder"},
          {"name": "Lead Alert", "value": "lead_alert"},
          {"name": "Custom", "value": "custom"}
        ]
      }
    }
  }',
  '{
    "to": "{{variable.after.phone}}",
    "message": "Hello {{variable.after.name}}, welcome! Your account is ready.",
    "template": "welcome"
  }',
  NOW(),
  NOW()
);

-- 4. Example External API Action (Google Drive - Future Implementation)
INSERT INTO workflow_action_registry (
  id,
  key,
  name,
  display_name,
  description,
  category,
  "group",
  icon,
  icon_color,
  execution_type,
  version,
  is_active,
  properties_schema,
  credentials_schema,
  operation_schema,
  sample_payload,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'google_drive_upload',
  'Google Drive Upload',
  'Upload to Google Drive',
  'Upload files to Google Drive folders',
  'external',
  ARRAY['action'],
  'google-drive',
  '#4285F4',
  'external_api',
  1,
  false, -- Disabled until implementation is complete
  '{
    "type": "object",
    "properties": {
      "operation": {
        "displayName": "Operation",
        "type": "options",
        "required": true,
        "options": [
          {"name": "Upload File", "value": "upload"},
          {"name": "Create Folder", "value": "create_folder"},
          {"name": "Share File", "value": "share"}
        ]
      },
      "fileName": {
        "displayName": "File Name",
        "type": "string",
        "placeholder": "{{variable.after.name}}_report.pdf"
      },
      "folderId": {
        "displayName": "Folder ID",
        "type": "string",
        "placeholder": "Google Drive folder ID"
      },
      "fileContent": {
        "displayName": "File Content",
        "type": "string",
        "description": "File content or path to file"
      }
    }
  }',
  '{
    "required": ["googleApi"],
    "googleApi": {
      "displayName": "Google API Credentials",
      "type": "oauth2",
      "scopes": ["https://www.googleapis.com/auth/drive.file"]
    }
  }',
  '{
    "file": {
      "operations": ["upload", "download", "delete", "share"],
      "displayName": "File Operations"
    },
    "folder": {
      "operations": ["create", "list", "delete"],
      "displayName": "Folder Operations"
    }
  }',
  '{
    "operation": "upload",
    "fileName": "{{variable.after.name}}_document.pdf",
    "folderId": "1ABCdef123456",
    "fileContent": "/path/to/file.pdf"
  }',
  NOW(),
  NOW()
);

-- 5. Conditional Action (If/Then Logic)
INSERT INTO workflow_action_registry (
  id,
  key,
  name,
  display_name,
  description,
  category,
  "group",
  icon,
  icon_color,
  execution_type,
  version,
  is_active,
  properties_schema,
  sample_payload,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'condition_if',
  'If Condition',
  'Conditional Logic',
  'Execute different paths based on conditions',
  'logic',
  ARRAY['action'],
  'branch',
  '#7C3AED',
  'conditional',
  1,
  false, -- Disabled until implementation is complete
  '{
    "type": "object",
    "properties": {
      "conditions": {
        "displayName": "Conditions",
        "type": "filter",
        "required": true,
        "description": "Define conditions to evaluate"
      },
      "combinator": {
        "displayName": "Combinator",
        "type": "options",
        "default": "AND",
        "options": [
          {"name": "AND (All conditions must be true)", "value": "AND"},
          {"name": "OR (Any condition must be true)", "value": "OR"}
        ]
      }
    },
    "outputs": [
      {"displayName": "True", "type": "main"},
      {"displayName": "False", "type": "main"}
    ]
  }',
  '{
    "conditions": {
      "combinator": "AND",
      "conditions": [
        {
          "variable": "{{variable.after.status}}",
          "operator": "equals",
          "value": "active",
          "type": "string"
        }
      ]
    }
  }',
  NOW(),
  NOW()
); 