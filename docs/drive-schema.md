Based on the n8n GoogleDriveTrigger node, here's how it would be represented in our schema:

## Trigger Registry Entry

```sql
INSERT INTO "trigger_registry" (
  "key",
  "name",
  "display_name",
  "description",
  "category",
  "event_source",
  "version",
  "properties_schema",
  "filter_schema",
  "sample_payload",
  "webhook_config",
  "available_variables"
) VALUES (
  'google_drive_trigger',
  'googleDriveTrigger',
  'Google Drive Trigger',
  'Starts the workflow when Google Drive events occur',
  'external',
  'poll',
  1,
  '{
    "credentials_required": ["googleApi", "googleDriveOAuth2Api"],
    "polling": true,
    "properties": [
      {
        "displayName": "Credential Type",
        "name": "authentication",
        "type": "options",
        "options": [
          {
            "name": "OAuth2 (recommended)",
            "value": "oAuth2"
          },
          {
            "name": "Service Account",
            "value": "serviceAccount"
          }
        ],
        "default": "oAuth2"
      },
      {
        "displayName": "Trigger On",
        "name": "triggerOn",
        "type": "options",
        "required": true,
        "default": "",
        "options": [
          {
            "name": "Changes to a Specific File",
            "value": "specificFile"
          },
          {
            "name": "Changes Involving a Specific Folder",
            "value": "specificFolder"
          }
        ]
      },
      {
        "displayName": "File",
        "name": "fileToWatch",
        "type": "resourceLocator",
        "default": {"mode": "list", "value": ""},
        "required": true,
        "modes": [
          {
            "displayName": "File",
            "name": "list",
            "type": "list",
            "placeholder": "Select a file...",
            "typeOptions": {
              "searchListMethod": "fileSearch",
              "searchable": true
            }
          },
          {
            "displayName": "Link",
            "name": "url",
            "type": "string",
            "placeholder": "https://drive.google.com/file/d/1wroCSfK-hupQIYf_xzeoUEzOhvfTFH2P/edit",
            "extractValue": {
              "type": "regex",
              "regex": "https://drive\\.google\\.com/file/d/([a-zA-Z0-9-_]+)"
            },
            "validation": [
              {
                "type": "regex",
                "properties": {
                  "regex": "https://drive\\.google\\.com/file/d/([a-zA-Z0-9-_]+)",
                  "errorMessage": "Not a valid Google Drive File URL"
                }
              }
            ]
          },
          {
            "displayName": "ID",
            "name": "id",
            "type": "string",
            "placeholder": "1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A",
            "validation": [
              {
                "type": "regex",
                "properties": {
                  "regex": "[a-zA-Z0-9\\\\-_]{2,}",
                  "errorMessage": "Not a valid Google Drive File ID"
                }
              }
            ],
            "url": "https://drive.google.com/file/d/{{$value}}/view"
          }
        ],
        "displayOptions": {
          "show": {
            "triggerOn": ["specificFile"]
          }
        }
      },
      {
        "displayName": "Watch For",
        "name": "event",
        "type": "options",
        "displayOptions": {
          "show": {
            "triggerOn": ["specificFile"]
          }
        },
        "required": true,
        "default": "fileUpdated",
        "options": [
          {
            "name": "File Updated",
            "value": "fileUpdated"
          }
        ],
        "description": "When to trigger this node"
      },
      {
        "displayName": "Folder",
        "name": "folderToWatch",
        "type": "resourceLocator",
        "default": {"mode": "list", "value": ""},
        "required": true,
        "modes": [
          {
            "displayName": "Folder",
            "name": "list",
            "type": "list",
            "placeholder": "Select a folder...",
            "typeOptions": {
              "searchListMethod": "folderSearch",
              "searchable": true
            }
          },
          {
            "displayName": "Link",
            "name": "url",
            "type": "string",
            "placeholder": "https://drive.google.com/drive/folders/1Tx9WHbA3wBpPB4C_HcoZDH9WZFWYxAMU",
            "extractValue": {
              "type": "regex",
              "regex": "https://drive\\.google\\.com/drive/folders/([a-zA-Z0-9-_]+)"
            },
            "validation": [
              {
                "type": "regex",
                "properties": {
                  "regex": "https://drive\\.google\\.com/drive/folders/([a-zA-Z0-9-_]+)",
                  "errorMessage": "Not a valid Google Drive Folder URL"
                }
              }
            ]
          },
          {
            "displayName": "ID",
            "name": "id",
            "type": "string",
            "placeholder": "1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A",
            "validation": [
              {
                "type": "regex",
                "properties": {
                  "regex": "[a-zA-Z0-9\\\\-_]{2,}",
                  "errorMessage": "Not a valid Google Drive Folder ID"
                }
              }
            ],
            "url": "https://drive.google.com/drive/folders/{{$value}}"
          }
        ],
        "displayOptions": {
          "show": {
            "triggerOn": ["specificFolder"]
          }
        }
      },
      {
        "displayName": "Watch For",
        "name": "event",
        "type": "options",
        "displayOptions": {
          "show": {
            "triggerOn": ["specificFolder"]
          }
        },
        "required": true,
        "default": "",
        "options": [
          {
            "name": "File Created",
            "value": "fileCreated",
            "description": "When a file is created in the watched folder"
          },
          {
            "name": "File Updated",
            "value": "fileUpdated",
            "description": "When a file is updated in the watched folder"
          },
          {
            "name": "Folder Created",
            "value": "folderCreated",
            "description": "When a folder is created in the watched folder"
          },
          {
            "name": "Folder Updated",
            "value": "folderUpdated",
            "description": "When a folder is updated in the watched folder"
          },
          {
            "name": "Watch Folder Updated",
            "value": "watchFolderUpdated",
            "description": "When the watched folder itself is modified"
          }
        ]
      },
      {
        "displayName": "Changes within subfolders wont trigger this node",
        "name": "notice",
        "type": "notice",
        "displayOptions": {
          "show": {
            "triggerOn": ["specificFolder"]
          },
          "hide": {
            "event": ["watchFolderUpdated"]
          }
        },
        "default": ""
      },
      {
        "displayName": "Options",
        "name": "options",
        "type": "collection",
        "displayOptions": {
          "show": {
            "event": ["fileCreated", "fileUpdated"]
          },
          "hide": {
            "triggerOn": ["specificFile"]
          }
        },
        "placeholder": "Add option",
        "default": {},
        "options": [
          {
            "displayName": "File Type",
            "name": "fileType",
            "type": "options",
            "options": [
              {"name": "[All]", "value": "all"},
              {"name": "Audio", "value": "application/vnd.google-apps.audio"},
              {"name": "Google Docs", "value": "application/vnd.google-apps.document"},
              {"name": "Google Drawings", "value": "application/vnd.google-apps.drawing"},
              {"name": "Google Slides", "value": "application/vnd.google-apps.presentation"},
              {"name": "Google Spreadsheets", "value": "application/vnd.google-apps.spreadsheet"},
              {"name": "Photos and Images", "value": "application/vnd.google-apps.photo"},
              {"name": "Videos", "value": "application/vnd.google-apps.video"}
            ],
            "default": "all",
            "description": "Triggers only when the file is this type"
          }
        ]
      }
    ],
    "methods": {
      "listSearch": {
        "fileSearch": "searchFiles",
        "folderSearch": "searchFolders"
      },
      "loadOptions": {
        "getDrives": "getDrivesList"
      }
    }
  }',
  '[
    {
      "displayName": "File Name",
      "name": "file_name",
      "type": "string",
      "operators": ["equals", "contains", "startsWith", "endsWith", "regex"]
    },
    {
      "displayName": "File Size",
      "name": "file_size",
      "type": "number",
      "operators": ["equals", "greaterThan", "lessThan", "between"]
    },
    {
      "displayName": "Modified Date",
      "name": "modified_date",
      "type": "date",
      "operators": ["equals", "after", "before", "between"]
    },
    {
      "displayName": "File Type",
      "name": "mime_type",
      "type": "options",
      "options": [
        {"name": "All", "value": "all"},
        {"name": "Google Docs", "value": "application/vnd.google-apps.document"},
        {"name": "Google Sheets", "value": "application/vnd.google-apps.spreadsheet"},
        {"name": "PDF", "value": "application/pdf"},
        {"name": "Image", "value": "image/*"}
      ],
      "operators": ["equals", "not_equals"]
    }
  ]',
  '{
    "id": "1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A",
    "name": "My Document.docx",
    "mimeType": "application/vnd.google-apps.document",
    "createdTime": "2023-12-01T10:30:00.000Z",
    "modifiedTime": "2023-12-01T15:45:00.000Z",
    "size": "524288",
    "webViewLink": "https://drive.google.com/file/d/1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A/view",
    "parents": ["1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"],
    "owners": [
      {
        "displayName": "John Doe",
        "emailAddress": "john.doe@example.com"
      }
    ],
    "lastModifyingUser": {
      "displayName": "Jane Smith",
      "emailAddress": "jane.smith@example.com"
    },
    "capabilities": {
      "canEdit": true,
      "canShare": true,
      "canComment": true
    }
  }',
  '{
    "polling_config": {
      "interval_minutes": 5,
      "query_params": {
        "includeItemsFromAllDrives": true,
        "supportsAllDrives": true,
        "spaces": "appDataFolder, drive",
        "corpora": "allDrives"
      }
    }
  }',
  '{
    "file": {
      "id": "string",
      "name": "string",
      "mimeType": "string",
      "createdTime": "string",
      "modifiedTime": "string",
      "size": "string",
      "webViewLink": "string",
      "parents": "array",
      "owners": "array",
      "lastModifyingUser": "object",
      "capabilities": "object"
    },
    "event_type": "string",
    "trigger_time": "string"
  }'
);
```

## Credential Types

```sql
-- Google OAuth2 API Credential
INSERT INTO "credential_type" (
  "name",
  "display_name",
  "description",
  "icon",
  "properties_schema",
  "test_endpoint",
  "auth_type",
  "supported_actions"
) VALUES (
  'googleDriveOAuth2Api',
  'Google Drive OAuth2 API',
  'OAuth2 credentials for accessing Google Drive API',
  'fab:google-drive',
  '{
    "properties": [
      {
        "displayName": "Client ID",
        "name": "clientId",
        "type": "string",
        "required": true
      },
      {
        "displayName": "Client Secret",
        "name": "clientSecret",
        "type": "string",
        "typeOptions": {"password": true},
        "required": true
      },
      {
        "displayName": "Scope",
        "name": "scope",
        "type": "hidden",
        "default": "https://www.googleapis.com/auth/drive"
      },
      {
        "displayName": "Auth URI",
        "name": "authUrl",
        "type": "hidden",
        "default": "https://accounts.google.com/o/oauth2/v2/auth"
      },
      {
        "displayName": "Token URI",
        "name": "accessTokenUrl",
        "type": "hidden",
        "default": "https://oauth2.googleapis.com/token"
      }
    ]
  }',
  '{
    "request": {
      "method": "GET",
      "url": "https://www.googleapis.com/drive/v3/about?fields=user",
      "headers": {
        "Authorization": "Bearer {{$credentials.accessToken}}"
      }
    },
    "rules": [
      {
        "type": "responseSuccessBody",
        "properties": {
          "key": "user.emailAddress",
          "value": "test",
          "message": "Connection successful!"
        }
      }
    ]
  }',
  'oauth2',
  '["google_drive_trigger", "google_drive_action"]'
);

-- Google Service Account Credential
INSERT INTO "credential_type" (
  "name",
  "display_name",
  "description",
  "icon",
  "properties_schema",
  "test_endpoint",
  "auth_type",
  "supported_actions"
) VALUES (
  'googleApi',
  'Google Service Account',
  'Service Account credentials for accessing Google APIs',
  'fab:google',
  '{
    "properties": [
      {
        "displayName": "Service Account Email",
        "name": "email",
        "type": "string",
        "required": true,
        "placeholder": "service-account@project.iam.gserviceaccount.com"
      },
      {
        "displayName": "Private Key",
        "name": "privateKey",
        "type": "string",
        "typeOptions": {"password": true, "rows": 5},
        "required": true,
        "description": "The private key from the service account JSON file"
      },
      {
        "displayName": "Project ID",
        "name": "projectId",
        "type": "string",
        "required": true
      },
      {
        "displayName": "Impersonate a User",
        "name": "delegatedEmail",
        "type": "string",
        "default": "",
        "description": "Email of the user to impersonate (for domain-wide delegation)"
      }
    ]
  }',
  '{
    "request": {
      "method": "GET",
      "url": "https://www.googleapis.com/drive/v3/about?fields=user",
      "headers": {
        "Authorization": "Bearer {{$credentials.accessToken}}"
      }
    },
    "rules": [
      {
        "type": "responseCode",
        "properties": {
          "value": 200,
          "message": "Service Account connection successful!"
        }
      }
    ]
  }',
  'service_account',
  '["google_drive_trigger", "google_drive_action", "google_sheets_action"]'
);
```

## Workflow Step Configuration Example

```sql
-- Example workflow step using this trigger
INSERT INTO "workflow_step" (
  "id",
  "workflow_id",
  "step_name",
  "step_type",
  "action_key",
  "credential_id",
  "resource",
  "operation",
  "cfg",
  "display_options",
  "step_order",
  "is_active"
) VALUES (
  gen_random_uuid(),
  'workflow-uuid-here',
  'Google Drive File Monitor',
  'trigger',
  'google_drive_trigger',
  'credential-uuid-here',
  'file',
  'fileUpdated',
  '{
    "authentication": "oAuth2",
    "triggerOn": "specificFolder",
    "folderToWatch": {
      "mode": "id",
      "value": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
    },
    "event": "fileCreated",
    "options": {
      "fileType": "application/vnd.google-apps.document"
    }
  }',
  '{
    "show": {
      "triggerOn": ["specificFolder"],
      "event": ["fileCreated"]
    }
  }',
  1,
  true
);
```

## API Endpoints for Dynamic Data

```typescript
// API endpoints to support the dynamic functionality

// GET /api/triggers/google_drive_trigger/search/files
// Implements fileSearch method
{
  "results": [
    {
      "name": "My Important Document.docx",
      "value": "1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A",
      "icon": "fa:file-word",
      "url": "https://drive.google.com/file/d/1anGBg0b5re2VtF2bKu201_a-Vnz5BHq9Y4r-yBDAj5A/view"
    }
  ],
  "paginationToken": "next-page-token"
}

// GET /api/triggers/google_drive_trigger/search/folders
// Implements folderSearch method
{
  "results": [
    {
      "name": "Projects Folder",
      "value": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "icon": "fa:folder",
      "url": "https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
    }
  ],
  "paginationToken": "next-page-token"
}

// GET /api/triggers/google_drive_trigger/load-options/drives
// Implements getDrives method
{
  "options": [
    {"name": "Root", "value": "root"},
    {"name": "Company Drive", "value": "0B9jNhSvVjoIUOk9PVA"},
    {"name": "Marketing Drive", "value": "0B9jNhSvVjoIUMkRPVB"}
  ]
}
```

## Polling Execution Logic

```typescript
// Service to handle the polling logic
class GoogleDriveTriggerService {
  async poll(stepConfig: any, credentials: any): Promise<any[]> {
    const { triggerOn, event, fileToWatch, folderToWatch, options } = stepConfig;

    // Build query based on configuration
    const query = ['trashed = false'];

    if (triggerOn === 'specificFolder' && event !== 'watchFolderUpdated') {
      const folderId = this.extractId(folderToWatch.value);
      query.push(`'${folderId}' in parents`);
    }

    if (event.startsWith('file')) {
      query.push("mimeType != 'application/vnd.google-apps.folder'");
    } else {
      query.push("mimeType = 'application/vnd.google-apps.folder'");
    }

    if (options?.fileType && options.fileType !== 'all') {
      query.push(`mimeType = '${options.fileType}'`);
    }

    // Add time filter for polling
    const lastCheck = await this.getLastPollTime(stepConfig.id);
    if (lastCheck) {
      if (event.includes('Created')) {
        query.push(`createdTime > '${lastCheck}'`);
      } else {
        query.push(`modifiedTime > '${lastCheck}'`);
      }
    }

    // Execute Google Drive API call
    const files = await this.googleDriveApi.listFiles({
      q: query.join(' AND '),
      fields: 'nextPageToken, files(*)',
      credentials,
    });

    // Filter for specific file/folder if needed
    if (triggerOn === 'specificFile') {
      const fileId = this.extractId(fileToWatch.value);
      files = files.filter((file) => file.id === fileId);
    }

    // Update last poll time
    await this.updateLastPollTime(stepConfig.id, new Date().toISOString());

    return files;
  }
}
```

This representation captures all the essential elements of the n8n GoogleDriveTrigger in our database schema:

1. **Complex Properties**: Resource locators, display options, validation rules
2. **Dynamic Data Loading**: Search methods for files/folders, load options for drives
3. **Credential Management**: Multiple auth types (OAuth2, Service Account)
4. **Polling Logic**: Time-based filtering, query building
5. **Event Types**: Different trigger conditions (file created/updated, folder changes)
6. **Filtering Options**: File type filtering, conditional display logic

The schema is flexible enough to handle the complex n8n node structure while maintaining our database-driven approach.
