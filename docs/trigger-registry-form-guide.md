# Trigger Registry Form Guide for Frontend Developers

This guide explains how to build dynamic forms for workflow triggers using the `trigger_registry` schema.

## Trigger Registry Structure

```typescript
interface TriggerRegistry {
  key: string; // Unique identifier
  name: string; // Internal name
  display_name: string; // User-friendly name
  description?: string; // Help text
  category: string; // Trigger category
  event_source: string; // How trigger receives events
  version: number; // Schema version
  is_active: boolean; // Enable/disable
  properties_schema: object; // Form configuration
  filter_schema?: object; // Available filter conditions
  sample_payload?: object; // Example trigger data
  webhook_config?: object; // Webhook-specific settings
  available_variables?: object; // Variables for filtering
}
```

## Schema Fields Explained

### 1. **properties_schema** - Main Form Configuration

This defines the form fields users fill out to configure the trigger.

```json
{
  "properties_schema": [
    {
      "displayName": "HTTP Method",
      "name": "httpMethod",
      "type": "options",
      "options": [
        { "name": "GET", "value": "GET" },
        { "name": "POST", "value": "POST" }
      ],
      "default": "POST"
    },
    {
      "displayName": "URL",
      "name": "url",
      "type": "string",
      "default": "https://jsonplaceholder.typicode.com/todos"
    },
    {
      "displayName": "Authentication Required",
      "name": "authRequired",
      "type": "boolean",
      "default": false
    }
  ]
}
```

**Frontend Usage:**

```typescript
// Render main trigger configuration form
function TriggerForm({ trigger }) {
  return (
    <div className="trigger-config">
      {trigger.properties_schema.map((property) => (
        <FormField key={property.name} property={property} />
      ))}
    </div>
  );
}
```

### 2. **filter_schema** - Available Filter Conditions

Defines what fields users can filter on when the trigger fires.

```json
{
  "filter_schema": [
    {
      "displayName": "Lead Status",
      "name": "lead_status",
      "type": "options",
      "options": [
        { "name": "New", "value": "new" },
        { "name": "Qualified", "value": "qualified" },
        { "name": "Converted", "value": "converted" }
      ],
      "operators": ["equals", "not_equals", "in"]
    },
    {
      "displayName": "Created Date",
      "name": "created_at",
      "type": "date",
      "operators": ["after", "before", "between"]
    },
    {
      "displayName": "Lead Score",
      "name": "score",
      "type": "number", //input type
      "operators": ["equals", "greater_than", "less_than", "between"]
    }
  ]
}
```

**Frontend Usage:**

```typescript
// Render filter builder
function FilterBuilder({ trigger }) {
  const [filters, setFilters] = useState([]);
  const [combinator, setCombinator] = useState('AND');

  return (
    <div className="filter-builder">
      <h4>Filter Conditions</h4>
      <div className="combinator-selector">
        <label>
          <input type="radio" value="AND" checked={combinator === 'AND'} onChange={(e) => setCombinator(e.target.value)} />
          All conditions must match (AND)
        </label>
        <label>
          <input type="radio" value="OR" checked={combinator === 'OR'} onChange={(e) => setCombinator(e.target.value)} />
          Any condition can match (OR)
        </label>
      </div>

      {filters.map((filter, index) => (
        <FilterCondition key={index} filter={filter} availableFields={trigger.filter_schema} onChange={(newFilter) => updateFilter(index, newFilter)} onRemove={() => removeFilter(index)} />
      ))}

      <button onClick={() => addNewFilter()}>+ Add Condition</button>
    </div>
  );
}
```

### 3. **available_variables** - Variables for Expressions

Defines what data variables are available from the trigger payload.

```json
{
  "available_variables": {
    "lead_id": "string",
    "lead_name": "string",
    "lead_email": "string",
    "lead_status": "string",
    "source": "string",
    "created_at": "string",
    "custom_fields": "object",
    "score": "number"
  }
}
```

**Frontend Usage:**

```typescript
// Variable picker for expressions
function VariablePicker({ trigger, onVariableSelect }) {
  const variables = Object.entries(trigger.available_variables || {});

  return (
    <div className="variable-picker">
      <h4>Available Variables</h4>
      <div className="variable-list">
        {variables.map(([name, type]) => (
          <div key={name} className="variable-item" onClick={() => onVariableSelect(`{{${name}}}`)}>
            <span className="variable-name">{name}</span>
            <span className="variable-type">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. **sample_payload** - Example Data

Shows users what data structure to expect from the trigger.

```json
{
  "sample_payload": {
    "lead_id": "12345",
    "lead_name": "John Doe",
    "lead_email": "john@example.com",
    "lead_status": "new",
    "source": "website",
    "created_at": "2023-12-01T10:00:00Z",
    "custom_fields": {
      "company": "Acme Corp",
      "phone": "+1234567890"
    },
    "score": 85
  }
}
```

**Frontend Usage:**

```typescript
// Sample payload display
function SamplePayload({ trigger }) {
  if (!trigger.sample_payload) return null;

  return (
    <div className="sample-payload">
      <h4>Sample Trigger Data</h4>
      <pre className="json-preview">{JSON.stringify(trigger.sample_payload, null, 2)}</pre>
    </div>
  );
}
```

### 5. **webhook_config** - Webhook Settings

Configuration specific to webhook triggers.

```json
{
  "webhook_config": {
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "auth_required": false,
    "response_mode": "onReceived",
    "timeout_seconds": 30,
    "max_payload_size": "10MB"
  }
}
```

**Frontend Usage:**

```typescript
// Webhook configuration section
function WebhookConfig({ trigger }) {
  if (!trigger.webhook_config) return null;

  return (
    <div className="webhook-config">
      <h4>Webhook Settings</h4>
      <div className="webhook-info">
        <div className="webhook-url">
          <label>Webhook URL:</label>
          <input type="text" value={generateWebhookUrl(trigger.key)} readOnly />
          <button onClick={() => copyWebhookUrl()}>Copy</button>
        </div>
        <div className="webhook-methods">
          <label>Allowed Methods:</label>
          <div className="method-list">
            {trigger.webhook_config.methods.map((method) => (
              <span key={method} className="method-tag">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Complete Trigger Form Component

```typescript
function TriggerForm({ trigger }) {
  const [config, setConfig] = useState({});
  const [filters, setFilters] = useState({ combinator: 'AND', conditions: [] });
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="trigger-form-container">
      <div className="trigger-card">
        <div className="trigger-header">
          <h3>{trigger.display_name}</h3>
          <span className="category">{trigger.category}</span>
          <span className="event-source">{trigger.event_source}</span>
        </div>

        {trigger.description && (
          <div className="trigger-description">
            <p>{trigger.description}</p>
          </div>
        )}

        {/* Main Configuration */}
        <div className="trigger-config-section">
          <h4>Configuration</h4>
          {trigger.properties_schema.map((property) => (
            <FormField key={property.name} property={property} value={config[property.name]} onChange={(value) => setConfig({ ...config, [property.name]: value })} />
          ))}
        </div>

        {/* Webhook-specific settings */}
        <WebhookConfig trigger={trigger} />

        {/* Filter Configuration */}
        {trigger.filter_schema && (
          <div className="filter-section">
            <h4>Filter Conditions</h4>
            <p>Only trigger workflow when these conditions are met:</p>
            <FilterBuilder schema={trigger.filter_schema} filters={filters} onChange={setFilters} availableVariables={trigger.available_variables} />
          </div>
        )}

        {/* Advanced Options */}
        <div className="advanced-section">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-options">
              <SamplePayload trigger={trigger} />
              <VariablePicker trigger={trigger} onVariableSelect={(variable) => console.log('Selected:', variable)} />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button onClick={() => testTrigger(trigger.key, config)}>Test Trigger</button>
          <button onClick={() => saveTrigger(trigger.key, config, filters)}>Save Trigger</button>
        </div>
      </div>
    </div>
  );
}
```

## Filter Condition Component

```typescript
function FilterCondition({ filter, availableFields, onChange, onRemove }) {
  const [selectedField, setSelectedField] = useState(filter.field || '');
  const [selectedOperator, setSelectedOperator] = useState(filter.operator || '');
  const [value, setValue] = useState(filter.value || '');

  const fieldConfig = availableFields.find((f) => f.name === selectedField);
  const availableOperators = fieldConfig?.operators || [];

  useEffect(() => {
    onChange({ field: selectedField, operator: selectedOperator, value });
  }, [selectedField, selectedOperator, value]);

  return (
    <div className="filter-condition">
      <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
        <option value="">Select field...</option>
        {availableFields.map((field) => (
          <option key={field.name} value={field.name}>
            {field.displayName}
          </option>
        ))}
      </select>

      <select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)} disabled={!selectedField}>
        <option value="">Select operator...</option>
        {availableOperators.map((op) => (
          <option key={op} value={op}>
            {formatOperator(op)}
          </option>
        ))}
      </select>

      <FilterValueInput fieldConfig={fieldConfig} operator={selectedOperator} value={value} onChange={setValue} />

      <button onClick={onRemove} className="remove-condition">
        ×
      </button>
    </div>
  );
}
```

## Filter Value Input Component

```typescript
function FilterValueInput({ fieldConfig, operator, value, onChange }) {
  if (!fieldConfig || !operator) return null;

  const renderInput = () => {
    switch (fieldConfig.type) {
      case 'string':
        return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Enter value..." />;

      case 'number':
        return <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} placeholder="Enter number..." />;

      case 'date':
        return <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />;

      case 'options':
        if (operator === 'in') {
          return (
            <select
              multiple
              value={value || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, (option) => option.value);
                onChange(values);
              }}
            >
              {fieldConfig.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          );
        } else {
          return (
            <select value={value} onChange={(e) => onChange(e.target.value)}>
              <option value="">Select...</option>
              {fieldConfig.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          );
        }

      default:
        return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return <div className="filter-value">{renderInput()}</div>;
}
```

## Trigger Types and Special Handling

### 1. **Webhook Triggers**

```typescript
function WebhookTrigger({ trigger }) {
  const webhookUrl = generateWebhookUrl(trigger.key);

  return (
    <div className="webhook-trigger">
      <div className="webhook-url-section">
        <label>Webhook URL:</label>
        <div className="url-input">
          <input type="text" value={webhookUrl} readOnly />
          <button onClick={() => copyToClipboard(webhookUrl)}>Copy</button>
        </div>
      </div>

      <div className="webhook-testing">
        <button onClick={() => sendTestWebhook(webhookUrl)}>Send Test Webhook</button>
      </div>
    </div>
  );
}
```

### 2. **Database Triggers (Debezium)**

```typescript
function DatabaseTrigger({ trigger }) {
  return (
    <div className="database-trigger">
      <div className="table-selection">
        <label>Table to Monitor:</label>
        <select>
          <option value="">Select table...</option>
          {/* Load from API */}
        </select>
      </div>

      <div className="operation-selection">
        <label>Operations to Monitor:</label>
        <div className="operation-checkboxes">
          <label>
            <input type="checkbox" value="INSERT" />
            Insert
          </label>
          <label>
            <input type="checkbox" value="UPDATE" />
            Update
          </label>
          <label>
            <input type="checkbox" value="DELETE" />
            Delete
          </label>
        </div>
      </div>
    </div>
  );
}
```

### 3. **Polling Triggers**

```typescript
function PollingTrigger({ trigger }) {
  return (
    <div className="polling-trigger">
      <div className="polling-interval">
        <label>Check Every:</label>
        <input type="number" min="1" max="1440" />
        <select>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
        </select>
      </div>

      <div className="polling-config">{/* Render specific polling configuration */}</div>
    </div>
  );
}
```

## API Integration

```typescript
// Get trigger configuration
async function getTrigger(triggerKey) {
  const response = await fetch(`/api/triggers/${triggerKey}`);
  return response.json();
}

// Get available variables for filters
async function getTriggerVariables(triggerKey) {
  const response = await fetch(`/api/triggers/${triggerKey}/variables`);
  return response.json();
}

// Test trigger configuration
async function testTrigger(triggerKey, config) {
  const response = await fetch(`/api/triggers/${triggerKey}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return response.json();
}

// Save trigger configuration
async function saveTrigger(triggerKey, config, filters) {
  const response = await fetch(`/api/workflow-steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action_key: triggerKey,
      step_type: 'trigger',
      cfg: config,
      filters: filters,
    }),
  });
  return response.json();
}
```

## Key Takeaways

1. **properties_schema**: Main form configuration - render as form fields
2. **filter_schema**: Available filter conditions - build filter UI
3. **available_variables**: Variables for expressions - show in variable picker
4. **sample_payload**: Example data structure - display for reference
5. **webhook_config**: Webhook-specific settings - show webhook URL and config
6. **event_source**: Determines trigger type - affects UI components shown
7. **category**: Groups triggers - use for organization and filtering

The trigger form is more complex than actions because it needs to handle:

- Main configuration (properties_schema)
- Filter conditions (filter_schema)
- Variable expressions (available_variables)
- Event source specific settings (webhook_config, polling config, etc.)
- Sample data preview (sample_payload)

Each trigger type may require different UI components based on its event_source and configuration requirements.
