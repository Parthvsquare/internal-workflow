## Enhanced Database Schema

First, let's enhance your existing schema to better support the n8n-style architecture:

```sql
-- Enhanced Action Registry
CREATE TABLE "action_registry" (
  "key" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- 'internal', 'external', 'ai', 'communication', etc.
  "group" TEXT[], -- ['action', 'trigger'] for n8n-style grouping
  "icon" TEXT,
  "icon_color" TEXT,
  "documentation_url" TEXT,
  "version" INT DEFAULT 1,
  "is_active" BOOLEAN DEFAULT TRUE,
  "properties_schema" JSONB, -- Node properties definition
  "credentials_schema" JSONB, -- Required credentials
  "operation_schema" JSONB, -- Available operations for this action
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Trigger Registry
CREATE TABLE "trigger_registry" (
  "key" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- 'webhook', 'database', 'schedule', 'email', etc.
  "event_source" TEXT, -- 'webhook', 'debezium', 'poll', 'manual'
  "version" INT DEFAULT 1,
  "is_active" BOOLEAN DEFAULT TRUE,
  "properties_schema" JSONB,
  "filter_schema" JSONB, -- Available filter conditions
  "sample_payload" JSONB,
  "webhook_config" JSONB, -- Webhook-specific configuration
  "available_variables" JSONB, -- Variables available for filtering
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Credentials System
CREATE TABLE "credential_type" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "properties_schema" JSONB NOT NULL, -- Field definitions
  "test_endpoint" JSONB, -- How to test the credential
  "auth_type" TEXT, -- 'oauth2', 'api_key', 'basic', 'custom'
  "supported_actions" TEXT[], -- Which actions support this credential
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "user_credentials" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "credential_type" TEXT REFERENCES "credential_type"("name"),
  "name" TEXT NOT NULL,
  "encrypted_data" TEXT NOT NULL, -- Encrypted credential data
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Step Configuration
ALTER TABLE "workflow_step" ADD COLUMN "credential_id" UUID REFERENCES "user_credentials"("id");
ALTER TABLE "workflow_step" ADD COLUMN "resource" TEXT; -- For resource/operation pattern
ALTER TABLE "workflow_step" ADD COLUMN "operation" TEXT;
ALTER TABLE "workflow_step" ADD COLUMN "display_options" JSONB; -- Show/hide conditions
```

## Action System Architecture

### 1. **Resource/Operation Pattern** (Like n8n)

```typescript
// Example action registry entry for Google Drive
{
  "key": "google_drive",
  "name": "googleDrive",
  "display_name": "Google Drive",
  "category": "external",
  "group": ["action"],
  "icon": "fab:google-drive",
  "credentials_schema": {
    "required": ["googleApi"],
    "optional": []
  },
  "operation_schema": {
    "file": {
      "operations": ["upload", "download", "delete", "copy", "move"],
      "display_name": "File"
    },
    "folder": {
      "operations": ["create", "list", "delete"],
      "display_name": "Folder"
    }
  },
  "properties_schema": [
    {
      "displayName": "Resource",
      "name": "resource",
      "type": "options",
      "options": [
        {"name": "File", "value": "file"},
        {"name": "Folder", "value": "folder"}
      ],
      "default": "file"
    },
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "options",
      "displayOptions": {
        "show": {"resource": ["file"]}
      },
      "options": [
        {"name": "Upload", "value": "upload"},
        {"name": "Download", "value": "download"},
        {"name": "Delete", "value": "delete"}
      ]
    },
    {
      "displayName": "File Path",
      "name": "filePath",
      "type": "string",
      "displayOptions": {
        "show": {
          "resource": ["file"],
          "operation": ["upload", "download"]
        }
      },
      "required": true
    }
  ]
}
```

### 2. **Internal vs External Actions**

**Internal Actions** (managed by your system):

```typescript
// SMS Action
{
  "key": "sms_send",
  "name": "smsSend",
  "display_name": "Send SMS",
  "category": "internal",
  "group": ["action"],
  "execution_type": "internal_function",
  "properties_schema": [
    {
      "displayName": "Phone Number",
      "name": "phoneNumber",
      "type": "string",
      "required": true
    },
    {
      "displayName": "Message",
      "name": "message",
      "type": "string",
      "required": true
    }
  ]
}

// Email Action
{
  "key": "email_send",
  "name": "emailSend",
  "display_name": "Send Email",
  "category": "internal",
  "execution_type": "internal_function",
  "properties_schema": [
    {
      "displayName": "To",
      "name": "to",
      "type": "string",
      "required": true
    },
    {
      "displayName": "Subject",
      "name": "subject",
      "type": "string",
      "required": true
    },
    {
      "displayName": "Body",
      "name": "body",
      "type": "string",
      "typeOptions": {"editor": "htmlEditor"}
    }
  ]
}
```

**External Actions** (require credentials):

```typescript
// Google Drive Action (example from above)
// Slack Action
{
  "key": "slack_message",
  "name": "slackMessage",
  "display_name": "Slack",
  "category": "external",
  "credentials_schema": {
    "required": ["slackApi"]
  },
  "properties_schema": [
    {
      "displayName": "Channel",
      "name": "channel",
      "type": "resourceLocator",
      "default": {"mode": "list", "value": ""},
      "modes": [
        {
          "displayName": "From List",
          "name": "list",
          "type": "list",
          "typeOptions": {
            "searchListMethod": "getChannels"
          }
        },
        {
          "displayName": "By ID",
          "name": "id",
          "type": "string"
        }
      ]
    },
    {
      "displayName": "Message",
      "name": "message",
      "type": "string",
      "required": true
    }
  ],
  "methods": {
    "loadOptions": {
      "getChannels": "// API call to fetch channels"
    }
  }
}
```

## Trigger System Architecture

### 1. **Trigger Types**

```typescript
// Webhook Trigger
{
  "key": "webhook_generic",
  "name": "webhookGeneric",
  "display_name": "Webhook",
  "category": "webhook",
  "event_source": "webhook",
  "webhook_config": {
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "auth_required": false,
    "response_mode": "onReceived"
  },
  "properties_schema": [
    {
      "displayName": "HTTP Method",
      "name": "httpMethod",
      "type": "options",
      "options": [
        {"name": "GET", "value": "GET"},
        {"name": "POST", "value": "POST"},
        {"name": "PUT", "value": "PUT"},
        {"name": "DELETE", "value": "DELETE"}
      ],
      "default": "POST"
    }
  ],
  "available_variables": {
    "headers": "object",
    "body": "object",
    "query": "object",
    "params": "object"
  }
}

// Database Trigger (Debezium)
{
  "key": "database_change",
  "name": "databaseChange",
  "display_name": "Database Change",
  "category": "database",
  "event_source": "debezium",
  "properties_schema": [
    {
      "displayName": "Table",
      "name": "table",
      "type": "options",
      "typeOptions": {
        "loadOptionsMethod": "getTables"
      }
    },
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "multiOptions",
      "options": [
        {"name": "Insert", "value": "INSERT"},
        {"name": "Update", "value": "UPDATE"},
        {"name": "Delete", "value": "DELETE"}
      ]
    }
  ],
  "available_variables": {
    "before": "object",
    "after": "object",
    "operation": "string",
    "timestamp": "string",
    "table": "string"
  },
  "sample_payload": {
    "before": null,
    "after": {"id": 1, "name": "John", "status": "active"},
    "operation": "INSERT",
    "timestamp": "2023-12-01T10:00:00Z",
    "table": "users"
  }
}

// CRM Lead Event
{
  "key": "crm_lead_event",
  "name": "crmLeadEvent",
  "display_name": "CRM Lead Event",
  "category": "crm",
  "event_source": "webhook",
  "webhook_config": {
    "methods": ["POST"],
    "auth_required": true
  },
  "available_variables": {
    "lead_id": "string",
    "lead_name": "string",
    "lead_email": "string",
    "lead_status": "string",
    "source": "string",
    "created_at": "string",
    "custom_fields": "object"
  },
  "filter_schema": [
    {
      "displayName": "Lead Status",
      "name": "lead_status",
      "type": "options",
      "options": [
        {"name": "New", "value": "new"},
        {"name": "Qualified", "value": "qualified"},
        {"name": "Converted", "value": "converted"}
      ]
    },
    {
      "displayName": "Source",
      "name": "source",
      "type": "string"
    }
  ]
}
```

## Filter System Implementation

### 1. **Dynamic Filter Generation**

```typescript
// When creating a workflow trigger, call the API to get available variables
// and generate filter conditions dynamically

interface FilterCondition {
  variable: string;        // {{variable.status}}
  operator: string;        // 'equals', 'not_equals', 'contains', 'greater_than'
  value: any;             // User input value
  type: 'string' | 'number' | 'boolean' | 'date';
}

interface TriggerFilter {
  combinator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

// Example: CRM Lead filter
{
  "combinator": "AND",
  "conditions": [
    {
      "variable": "{{variable.lead_status}}",
      "operator": "not_equals",
      "value": "spam",
      "type": "string"
    },
    {
      "variable": "{{variable.source}}",
      "operator": "equals",
      "value": "website",
      "type": "string"
    }
  ]
}
```

### 2. **Filter Evaluation Engine**

```typescript
class FilterEngine {
  evaluateFilter(filter: TriggerFilter, payload: any): boolean {
    const results = filter.conditions.map((condition) => this.evaluateCondition(condition, payload));

    return filter.combinator === 'AND' ? results.every((r) => r) : results.some((r) => r);
  }

  private evaluateCondition(condition: FilterCondition, payload: any): boolean {
    const variableValue = this.extractVariable(condition.variable, payload);
    return this.applyOperator(variableValue, condition.operator, condition.value);
  }

  private extractVariable(variablePath: string, payload: any): any {
    // Extract {{variable.lead_status}} -> payload.lead_status
    const path = variablePath.replace(/\{\{variable\.|\}\}/g, '');
    return path.split('.').reduce((obj, key) => obj?.[key], payload);
  }
}
```

## Conditional Nodes Implementation

### 1. **If/Condition Node**

```typescript
{
  "key": "condition_if",
  "name": "conditionIf",
  "display_name": "If",
  "category": "internal",
  "group": ["logic"],
  "execution_type": "conditional",
  "properties_schema": [
    {
      "displayName": "Conditions",
      "name": "conditions",
      "type": "filter",
      "typeOptions": {
        "version": 2,
        "caseSensitive": true,
        "allowedCombinators": ["and", "or"]
      }
    }
  ],
  "outputs": [
    {"displayName": "True", "type": "main"},
    {"displayName": "False", "type": "main"}
  ]
}
```

### 2. **Filter Node**

```typescript
{
  "key": "filter_items",
  "name": "filterItems",
  "display_name": "Filter",
  "category": "internal",
  "group": ["transform"],
  "properties_schema": [
    {
      "displayName": "Conditions",
      "name": "conditions",
      "type": "filter",
      "typeOptions": {
        "version": 2
      }
    },
    {
      "displayName": "Options",
      "name": "options",
      "type": "collection",
      "options": [
        {
          "displayName": "Keep Items That Don't Match",
          "name": "keepItemsThatDontMatch",
          "type": "boolean",
          "default": false
        }
      ]
    }
  ]
}
```

## Implementation Recommendations

### 1. **API Structure for Dynamic Forms**

```typescript
// GET /api/triggers/{triggerKey}/variables
// Returns available variables for filter creation
{
  "variables": [
    {
      "name": "lead_status",
      "displayName": "Lead Status",
      "type": "string",
      "path": "variable.lead_status",
      "options": ["new", "qualified", "converted", "spam"]
    },
    {
      "name": "created_at",
      "displayName": "Created At",
      "type": "date",
      "path": "variable.created_at"
    }
  ]
}

// GET /api/actions/{actionKey}/operations
// Returns available operations for an action
{
  "operations": [
    {
      "resource": "file",
      "operations": ["upload", "download", "delete"],
      "properties": [/* dynamic properties based on operation */]
    }
  ]
}
```

### 2. **Execution Engine**

```typescript
class WorkflowExecutor {
  async executeStep(step: WorkflowStep, inputData: any[]): Promise<any[]> {
    const actionConfig = await this.getActionConfig(step.action_key);

    if (actionConfig.execution_type === 'internal_function') {
      return this.executeInternalFunction(step, inputData);
    } else if (actionConfig.execution_type === 'external_api') {
      return this.executeExternalApi(step, inputData);
    } else if (actionConfig.execution_type === 'conditional') {
      return this.executeConditional(step, inputData);
    }
  }

  private async executeInternalFunction(step: WorkflowStep, inputData: any[]): Promise<any[]> {
    // Execute internal functions like SMS, email, etc.
    switch (step.action_key) {
      case 'sms_send':
        return this.sendSMS(step.cfg, inputData);
      case 'email_send':
        return this.sendEmail(step.cfg, inputData);
      // ... other internal functions
    }
  }

  private async executeExternalApi(step: WorkflowStep, inputData: any[]): Promise<any[]> {
    // Execute external API calls with authentication
    const credentials = await this.getCredentials(step.credential_id);
    const apiClient = this.createApiClient(step.action_key, credentials);
    return apiClient.execute(step.cfg, inputData);
  }
}
```

This architecture provides:

1. **Flexibility**: Easy to add new actions and triggers
2. **Dynamic UI**: Forms generated from schema definitions
3. **Security**: Proper credential management
4. **Scalability**: Separation of internal and external actions
5. **Maintainability**: Clear separation of concerns
6. **Extensibility**: Plugin-like architecture for adding new integrations

The key is to follow n8n's proven patterns while adapting them to your database-driven architecture and specific use cases with Debezium and internal functions.
