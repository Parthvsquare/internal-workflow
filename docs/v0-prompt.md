# V0 Prompt: Workflow Action & Trigger Registry Forms

## Overview

Build dynamic form components for a workflow automation platform similar to n8n. Create forms that generate UI dynamically based on JSON schema configurations for both Actions and Triggers.

## Core Requirements

### 1. Action Registry Form Component

Build a form that renders based on `action_registry` schema with two main types:

**Simple Actions** (direct properties):

```json
{
  "key": "send_email",
  "display_name": "Send Email",
  "category": "communication",
  "properties_schema": [
    {
      "displayName": "To",
      "name": "to",
      "type": "string",
      "required": true,
      "placeholder": "recipient@example.com"
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
      "typeOptions": { "rows": 5 }
    }
  ]
}
```

**Complex Actions** (resource/operation pattern):

```json
{
  "key": "google_drive",
  "display_name": "Google Drive",
  "category": "external",
  "operation_schema": {
    "file": {
      "operations": ["upload", "download", "delete"],
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
        { "name": "File", "value": "file" },
        { "name": "Folder", "value": "folder" }
      ],
      "required": true
    },
    {
      "displayName": "Operation",
      "name": "operation",
      "type": "options",
      "displayOptions": {
        "show": { "resource": ["file"] }
      },
      "options": [
        { "name": "Upload", "value": "upload" },
        { "name": "Download", "value": "download" }
      ],
      "required": true
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

### 2. Trigger Registry Form Component

Build a form that handles trigger configuration with multiple schema parts:

```json
{
  "key": "crm_lead_event",
  "display_name": "CRM Lead Event",
  "category": "crm",
  "event_source": "webhook",
  "properties_schema": [
    {
      "displayName": "HTTP Method",
      "name": "httpMethod",
      "type": "options",
      "options": [
        { "name": "POST", "value": "POST" },
        { "name": "GET", "value": "GET" }
      ],
      "default": "POST"
    }
  ],
  "filter_schema": [
    {
      "displayName": "Lead Status",
      "name": "lead_status",
      "type": "options",
      "options": [
        { "name": "New", "value": "new" },
        { "name": "Qualified", "value": "qualified" }
      ],
      "operators": ["equals", "not_equals", "in"]
    },
    {
      "displayName": "Lead Score",
      "name": "score",
      "type": "number",
      "operators": ["greater_than", "less_than", "between"]
    }
  ],
  "available_variables": {
    "lead_id": "string",
    "lead_name": "string",
    "lead_status": "string",
    "score": "number"
  },
  "sample_payload": {
    "lead_id": "12345",
    "lead_name": "John Doe",
    "lead_status": "new",
    "score": 85
  },
  "webhook_config": {
    "methods": ["POST"],
    "auth_required": false
  }
}
```

## Field Types to Support

### Basic Types

- **string**: Text input (`<input type="text">`)
- **number**: Number input (`<input type="number">`)
- **boolean**: Checkbox or toggle switch
- **hidden**: Hidden input (not visible)
- **notice**: Info display (not an input field)

### Advanced Types

- **options**: Single-select dropdown
- **multiOptions**: Multi-select dropdown
- **resourceLocator**: Multi-mode field with tabs (List/ID/URL modes)
- **collection**: Collapsible grouped fields
- **filter**: Advanced filter builder with AND/OR logic

### Special Handling

- **typeOptions.password**: Render as password input
- **typeOptions.rows**: Set textarea rows
- **typeOptions.searchListMethod**: Load options dynamically via API

## Dynamic Behavior Requirements

### 1. Conditional Display Logic

Fields can show/hide based on other field values using `displayOptions`:

```json
{
  "displayOptions": {
    "show": {
      "resource": ["file"],
      "operation": ["upload"]
    },
    "hide": {
      "triggerType": ["manual"]
    }
  }
}
```

### 2. Resource/Operation Flow

For complex actions:

1. User selects Resource → Update Operation dropdown options
2. User selects Operation → Show/hide relevant fields
3. Dynamic API calls to load additional properties if needed

### 3. Filter Builder (Triggers Only)

Build advanced filter UI with:

- AND/OR combinator selection
- Field selection from `filter_schema`
- Operator selection based on field type
- Value input appropriate for field type
- Add/remove conditions dynamically

## Visual Design Requirements

### Card Layout

- **Header**: Icon + Display Name + Category badge
- **Description**: Help text below header
- **Form Sections**: Organized into logical groups
- **Actions**: Test/Save buttons at bottom

### Form Styling

- **Labels**: Clear field labels with required asterisks
- **Validation**: Inline error messages
- **Grouping**: Visual separation between sections
- **Progressive Disclosure**: Collapsible advanced options

### Responsive Design

- Mobile-friendly form layouts
- Proper spacing and typography
- Accessible form controls

## Component Architecture

### Main Components Needed:

1. **ActionRegistryForm** - Main action form component
2. **TriggerRegistryForm** - Main trigger form component
3. **DynamicField** - Renders individual form fields based on type
4. **FilterBuilder** - Advanced filter condition builder
5. **ResourceLocator** - Multi-mode field component
6. **VariablePicker** - Shows available variables
7. **WebhookConfig** - Webhook-specific settings

### State Management:

- Form data state
- Field visibility state (for displayOptions)
- Validation errors state
- Loading states for dynamic data

## Technical Implementation Details

### Props Structure:

```typescript
interface ActionRegistryFormProps {
  action: {
    key: string;
    display_name: string;
    category: string;
    properties_schema: PropertySchema[];
    operation_schema?: OperationSchema;
    credentials_schema?: CredentialsSchema;
  };
  onSubmit: (data: any) => void;
  onTest?: (data: any) => void;
}

interface TriggerRegistryFormProps {
  trigger: {
    key: string;
    display_name: string;
    category: string;
    event_source: string;
    properties_schema: PropertySchema[];
    filter_schema?: FilterSchema[];
    available_variables?: Record<string, string>;
    sample_payload?: any;
    webhook_config?: WebhookConfig;
  };
  onSubmit: (data: any, filters: any) => void;
  onTest?: (data: any) => void;
}
```

### API Integration:

- Load dynamic options: `GET /api/actions/{key}/load-options/{method}`
- Get trigger variables: `GET /api/triggers/{key}/variables`
- Test configuration: `POST /api/actions/{key}/test`

## Example Usage:

```tsx
<ActionRegistryForm
  action={googleDriveAction}
  onSubmit={(data) => console.log('Action config:', data)}
  onTest={(data) => console.log('Testing action:', data)}
/>

<TriggerRegistryForm
  trigger={crmLeadTrigger}
  onSubmit={(data, filters) => console.log('Trigger config:', data, filters)}
  onTest={(data) => console.log('Testing trigger:', data)}
/>
```

## Key Features to Implement:

1. **Dynamic form generation** from JSON schema
2. **Conditional field visibility** based on user selections
3. **Multi-mode fields** (resourceLocator with tabs)
4. **Advanced filter builder** with drag-and-drop conditions
5. **Real-time validation** with error messages
6. **API integration** for dynamic data loading
7. **Responsive design** for mobile/desktop
8. **Accessible form controls** with proper ARIA labels

Build this as a modern React component using TypeScript, with clean styling and smooth user interactions.
