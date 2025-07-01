## 🗄️ **Database Configuration**

**Single PostgreSQL Database** shared across all services:

- **API Service** (main application)
- **Worker Service** (processes workflows)
- **Scheduler Service** (handles webhooks/scheduling)

```typescript
// Database config (same across all services)
{
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'mydb',
  synchronize: true,
  entities: [...ENTITY] // 17 total entities
}
```

## 📊 **Data Categories & Storage Mapping**

Ran tool

## 📝 **Detailed Storage Breakdown**

### **1. DESIGN TIME DATA** (User Configuration)

| **Table**               | **What It Stores**                                      | **When Saved**                      | **Saved By**          |
| ----------------------- | ------------------------------------------------------- | ----------------------------------- | --------------------- |
| `workflow_definition`   | Workflow metadata (name, description, category, tags)   | User creates workflow               | **API Service**       |
| `workflow_version`      | Immutable workflow versions + S3 storage keys           | User saves/publishes workflow       | **API Service**       |
| `workflow_step`         | Individual workflow steps (actions, conditions, delays) | User adds steps to workflow         | **API Service**       |
| `workflow_edge`         | Connections between steps (graph structure)             | User connects steps                 | **API Service**       |
| `workflow_variable`     | User-defined variables (encrypted if needed)            | User configures variables           | **API Service**       |
| `workflow_subscription` | Links workflows to triggers + filter conditions         | User subscribes workflow to trigger | **API Service**       |
| `webhook_endpoint`      | Webhook URL configurations                              | User enables webhook triggers       | **Scheduler Service** |
| `schedule_trigger`      | Cron job configurations                                 | User sets up scheduled triggers     | **Scheduler Service** |

### **2. REGISTRY DATA** (Available Components)

| **Table**                   | **What It Stores**                                      | **When Saved**                     | **Saved By**                       |
| --------------------------- | ------------------------------------------------------- | ---------------------------------- | ---------------------------------- |
| `workflow_action_registry`  | Available actions (SMS, email, task creation, etc.)     | System startup/admin configuration | **API Service** (migrations/seeds) |
| `workflow_trigger_registry` | Available triggers (database, webhook, schedule)        | System startup/admin configuration | **API Service** (migrations/seeds) |
| `credential_type`           | Authentication type definitions (OAuth2, API key, etc.) | System startup/admin configuration | **API Service** (migrations/seeds) |
| `user_credentials`          | User's encrypted authentication data                    | User adds credentials              | **API Service**                    |

### **3. RUNTIME DATA** (Execution Tracking)

| **Table**            | **What It Stores**                                   | **When Saved**                | **Saved By**       |
| -------------------- | ---------------------------------------------------- | ----------------------------- | ------------------ |
| `workflow_execution` | Overall execution tracking (status, metrics, timing) | Workflow execution starts     | **Worker Service** |
| `step_execution`     | Individual step execution details (results, errors)  | Each step executes            | **Worker Service** |
| `tasks`              | Generated tasks from workflow actions                | Task creation action executes | **Worker Service** |

### **4. CONVENIENCE VIEW**

| **View**               | **What It Provides**               | **Purpose**                                |
| ---------------------- | ---------------------------------- | ------------------------------------------ |
| `workflow_latest_json` | Latest workflow definition as JSON | Quick access to current workflow structure |

## 🔄 **Data Flow During Workflow Execution**

Read file: library/workflow-engine/src/lib/services/workflow-engine.service.ts

## 💾 **Specific Data Storage Flows**

### **A) Workflow Creation Flow (API Service)**

```typescript
// 1. User creates workflow → workflow_definition
const workflow = await workflowRepository.save({
  name: 'Lead Processing',
  description: 'Process new leads',
  category: 'automation',
  is_active: true,
});

// 2. User saves version → workflow_version
const version = await versionRepository.save({
  workflow_id: workflow.id,
  version_num: 1,
  s3_key: `s3://workflows/${workflow.id}/v1.json`,
});

// 3. User adds steps → workflow_step
const step = await stepRepository.save({
  version_id: version.id,
  kind: 'action',
  action_key: 'task_management',
  cfg: { operation: 'create', title: 'Follow up lead' },
});

// 4. User connects steps → workflow_edge
await edgeRepository.save({
  from_step_id: step1.id,
  to_step_id: step2.id,
  branch_key: 'default',
});

// 5. User subscribes to trigger → workflow_subscription
await subscriptionRepository.save({
  workflow_id: workflow.id,
  trigger_key: 'lead_sources_db_change',
  filter_conditions: {
    /* filter logic */
  },
});
```

### **B) Workflow Execution Flow (Worker Service)**

```typescript
// 1. Event arrives → Find subscriptions
const subscriptions = await subscriptionRepository.find({
  where: { trigger_key: 'lead_sources_db_change' },
});

// 2. Create workflow run → workflow_run
const workflowRun = await runRepository.save({
  workflow_id: workflow.id,
  version_id: version.id,
  trigger_event_id: 'event-123',
  trigger_type: 'database',
  status: 'PENDING',
  context_data: eventData,
});

// 3. Execute each step → step_run (not shown in the code above, but this is where it would happen)
for (const step of steps) {
  const stepRun = await stepRunRepository.save({
    run_id: workflowRun.id,
    step_id: step.id,
    status: 'PENDING',
    started_at: new Date(),
  });

  // Execute step logic...

  // Update step_run with results
  await stepRunRepository.update(
    { run_id: workflowRun.id, step_id: step.id },
    {
      status: 'SUCCESS',
      ended_at: new Date(),
      result_data: stepResult,
      execution_time: duration,
    }
  );
}

// 4. If task creation action → tasks
if (action_key === 'task_management') {
  await taskRepository.save({
    title: 'Follow up with lead',
    description: 'Generated from workflow',
    status: TaskStatus.PENDING,
  });
}
```

## 🔍 **Data Access Patterns**

### **Read-Heavy Operations**

- **Trigger Processing**: Read from `workflow_trigger_registry` → `workflow_subscription` → `workflow_definition`
- **Workflow Execution**: Read from `workflow_definition` → `workflow_version` → `workflow_step` → `workflow_variable`
- **Action Execution**: Read from `workflow_action_registry`

### **Write-Heavy Operations**

- **Runtime Tracking**: Write to `workflow_run` → `step_run`
- **Task Generation**: Write to `tasks`
- **Metrics**: Update `workflow_run` with execution metrics

### **Mixed Read/Write**

- **User Configuration**: Read/Write `workflow_definition`, `workflow_step`, `workflow_variable`
- **Credential Management**: Read/Write `user_credentials`

## 🏗️ **Service Responsibilities**

| **Service**           | **Primary Role**                    | **Database Operations**          |
| --------------------- | ----------------------------------- | -------------------------------- |
| **API Service**       | User interface, workflow management | CREATE/UPDATE design-time data   |
| **Worker Service**    | Workflow execution                  | CREATE/UPDATE runtime data       |
| **Scheduler Service** | Webhooks, scheduling                | CREATE/UPDATE trigger management |
