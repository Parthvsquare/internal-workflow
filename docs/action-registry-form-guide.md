# Action Registry Form Guide for Frontend Developers

This guide explains how to build dynamic forms for workflow actions using the `action_registry` schema.

## Action Registry Structure

```typescript
interface ActionRegistry {
  key: string; // Unique identifier
  name: string; // Internal name
  display_name: string; // User-friendly name
  description?: string; // Help text
  category: string; // Action category
  group: string[]; // ['action', 'trigger']
  icon?: string; // Icon identifier
  icon_color?: string; // Icon color
  documentation_url?: string; // Help documentation
  version: number; // Schema version
  is_active: boolean; // Enable/disable
  properties_schema: object; // Form configuration
  credentials_schema?: object; // Required credentials
  operation_schema?: object; // Available operations
}
```

## Two Types of Actions

### 1. Simple Actions (No Operations)

Actions with direct properties - render form directly from `properties_schema`.

```json
{
  "key": "send_email",
  "name": "sendEmail",
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

**Frontend Implementation:**

```typescript
// Simple action - render form directly
function renderSimpleActionForm(action: ActionRegistry) {
  return (
    <form>
      <h3>{action.display_name}</h3>
      {action.properties_schema.map((property) => (
        <FormField key={property.name} property={property} />
      ))}
    </form>
  );
}
```

### 2. Resource/Operation Actions (Complex)

Actions with multiple resources and operations - dynamic form based on selections.

```json
{
  "key": "google_drive",
  "name": "googleDrive",
  "display_name": "Google Drive",
  "category": "external",
  "credentials_schema": {
    "required": ["googleApi"],
    "optional": []
  },
  "operation_schema": {
    "file": {
      "operations": ["upload", "download", "delete", "copy"],
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
      "default": "file",
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
        { "name": "Download", "value": "download" },
        { "name": "Delete", "value": "delete" },
        { "name": "Copy", "value": "copy" }
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

## Building Resource/Operation Forms

### Step 1: Resource Selection

```typescript
function ResourceSelector({ action, onResourceChange }) {
  const resources = Object.keys(action.operation_schema || {});

  return (
    <select onChange={(e) => onResourceChange(e.target.value)}>
      <option value="">Select Resource...</option>
      {resources.map((resourceKey) => (
        <option key={resourceKey} value={resourceKey}>
          {action.operation_schema[resourceKey].display_name}
        </option>
      ))}
    </select>
  );
}
```

### Step 2: Dynamic Operation Options

```typescript
function updateOperationOptions(selectedResource, action) {
  if (!selectedResource || !action.operation_schema) return [];

  const resourceConfig = action.operation_schema[selectedResource];
  return resourceConfig.operations.map((op) => ({
    name: formatOperationName(op), // "upload" -> "Upload"
    value: op,
  }));
}

// Update properties_schema dynamically
function updatePropertiesSchema(action, selectedResource) {
  return action.properties_schema.map((property) => {
    if (property.name === 'operation') {
      return {
        ...property,
        options: updateOperationOptions(selectedResource, action),
      };
    }
    return property;
  });
}
```

### Step 3: Complete Form Component

```typescript
function ActionForm({ action }) {
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [formData, setFormData] = useState({});

  // Check if action has operations
  const hasOperations = action.operation_schema && Object.keys(action.operation_schema).length > 0;

  // Get current properties based on selections
  const currentProperties = hasOperations ? updatePropertiesSchema(action, selectedResource) : action.properties_schema;

  return (
    <form className="action-form">
      <div className="action-header">
        <h3>{action.display_name}</h3>
        {action.description && <p>{action.description}</p>}
      </div>

      {/* Credentials Section */}
      {action.credentials_schema && (
        <div className="credentials-section">
          <h4>Authentication</h4>
          <CredentialSelector required={action.credentials_schema.required} optional={action.credentials_schema.optional} />
        </div>
      )}

      {/* Dynamic Properties */}
      <div className="properties-section">
        {currentProperties.map((property) => {
          // Check display conditions
          if (!shouldShowProperty(property, formData)) {
            return null;
          }

          return <FormField key={property.name} property={property} value={formData[property.name]} onChange={(value) => handleFieldChange(property.name, value)} onResourceChange={setSelectedResource} onOperationChange={setSelectedOperation} />;
        })}
      </div>
    </form>
  );
}
```

## Form Field Component Implementation

```typescript
function FormField({ property, value, onChange, onResourceChange, onOperationChange }) {
  const handleChange = (newValue) => {
    onChange(newValue);

    // Special handling for resource/operation changes
    if (property.name === 'resource') {
      onResourceChange(newValue);
    } else if (property.name === 'operation') {
      onOperationChange(newValue);
    }
  };

  switch (property.type) {
    case 'string':
      return (
        <div className="form-field">
          <label>
            {property.displayName} {property.required && '*'}
          </label>
          <input type={property.typeOptions?.password ? 'password' : 'text'} value={value || ''} onChange={(e) => handleChange(e.target.value)} placeholder={property.placeholder} required={property.required} />
          {property.description && <small>{property.description}</small>}
        </div>
      );

    case 'options':
      return (
        <div className="form-field">
          <label>
            {property.displayName} {property.required && '*'}
          </label>
          <select value={value || property.default || ''} onChange={(e) => handleChange(e.target.value)} required={property.required}>
            <option value="">Select...</option>
            {property.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      );

    case 'resourceLocator':
      return <ResourceLocatorField property={property} value={value} onChange={handleChange} />;

    case 'collection':
      return <CollectionField property={property} value={value} onChange={handleChange} />;

    // ... other field types
  }
}
```

## Display Conditions Logic

```typescript
function shouldShowProperty(property, formData) {
  if (!property.displayOptions) return true;

  const { show, hide } = property.displayOptions;

  // Check show conditions
  if (show) {
    for (const [fieldName, allowedValues] of Object.entries(show)) {
      const fieldValue = formData[fieldName];
      if (!allowedValues.includes(fieldValue)) {
        return false;
      }
    }
  }

  // Check hide conditions
  if (hide) {
    for (const [fieldName, hiddenValues] of Object.entries(hide)) {
      const fieldValue = formData[fieldName];
      if (hiddenValues.includes(fieldValue)) {
        return false;
      }
    }
  }

  return true;
}
```

## Credential Integration

```typescript
function CredentialSelector({ required, optional }) {
  const [availableCredentials, setAvailableCredentials] = useState([]);

  useEffect(() => {
    // Load user's saved credentials
    fetchCredentials(required.concat(optional || [])).then(setAvailableCredentials);
  }, [required, optional]);

  return (
    <div className="credential-selector">
      {required.map((credType) => (
        <div key={credType} className="required-credential">
          <label>{formatCredentialName(credType)} *</label>
          <select required>
            <option value="">Select credential...</option>
            {availableCredentials
              .filter((cred) => cred.credential_type === credType)
              .map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name}
                </option>
              ))}
          </select>
          <button type="button" onClick={() => createNewCredential(credType)}>
            + Add New
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Integration

```typescript
// Get dynamic properties based on resource/operation
async function loadDynamicProperties(actionKey, resource, operation) {
  const response = await fetch(`/api/actions/${actionKey}/properties?resource=${resource}&operation=${operation}`);
  return response.json();
}

// Load options for dropdowns
async function loadOptions(actionKey, methodName) {
  const response = await fetch(`/api/actions/${actionKey}/load-options/${methodName}`);
  return response.json();
}

// Test action configuration
async function testAction(actionKey, config) {
  const response = await fetch(`/api/actions/${actionKey}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return response.json();
}
```

## Form Validation

```typescript
function validateActionForm(properties, formData) {
  const errors = {};

  properties.forEach((property) => {
    if (!shouldShowProperty(property, formData)) return;

    const value = formData[property.name];

    // Required field validation
    if (property.required && (!value || value === '')) {
      errors[property.name] = `${property.displayName} is required`;
      return;
    }

    // Custom validation rules
    if (property.validation && value) {
      property.validation.forEach((rule) => {
        if (rule.type === 'regex') {
          const regex = new RegExp(rule.properties.regex);
          if (!regex.test(value)) {
            errors[property.name] = rule.properties.errorMessage;
          }
        }
      });
    }
  });

  return errors;
}
```

## Complete Form Example

```typescript
function CompleteActionForm({ action }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateActionForm(action.properties_schema, formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await saveActionConfiguration(action.key, formData);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="action-form-container">
      <div className="action-card">
        <div className="action-header">
          <img src={getIconUrl(action.icon)} alt="" />
          <div>
            <h3>{action.display_name}</h3>
            <span className="category">{action.category}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <ActionForm action={action} formData={formData} errors={errors} onChange={setFormData} />

          <div className="form-actions">
            <button type="button" onClick={() => testAction(action.key, formData)}>
              Test Action
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Key Takeaways

1. **Simple Actions**: Render form directly from `properties_schema`
2. **Complex Actions**: Use `operation_schema` to determine available operations, then filter `properties_schema` based on selections
3. **Dynamic Properties**: Show/hide fields based on `displayOptions` conditions
4. **Credentials**: Handle authentication requirements from `credentials_schema`
5. **Validation**: Implement client-side validation from property rules
6. **API Integration**: Load dynamic options and test configurations

The relationship between `properties_schema` and `operation_schema` is that the operation schema defines what operations are available for each resource, while the properties schema defines the form fields - some of which may be filtered based on the selected resource/operation combination.
