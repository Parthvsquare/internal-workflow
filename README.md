# LeadSend Internal Workflow System

## 📋 **Project Overview**

LeadSend Internal Workflow System is a comprehensive workflow automation platform built with a modern microservices architecture. The system enables both **developers** and **end-users** to create, manage, and execute complex workflows for business process automation.

### 🎯 **What This System Does**

This platform provides a complete workflow automation solution that allows:

- **Automated Business Processes**: Create workflows that respond to triggers (database changes, webhooks, schedules)
- **Multi-Step Orchestration**: Chain together multiple actions like sending emails, creating tasks, data processing
- **Real-time Execution**: Process workflows in real-time with comprehensive tracking and monitoring
- **Flexible Integration**: Connect with external services through configurable actions and credentials

### 👥 **Dual Perspective Approach**

#### **🧑‍💻 Developer Perspective**

- **Code-First Workflow Creation**: Developers can define workflows using TypeScript/JavaScript with full programmatic control
- **Custom Action Development**: Build reusable workflow actions and register them in the system
- **API Integration**: Create workflows via REST APIs with complete programmatic control
- **Advanced Configuration**: Access to raw configuration objects, custom filters, and complex business logic

```typescript
// Developer creating workflow via API
const workflow = await workflowService.create({
  name: 'Lead Processing Pipeline',
  steps: [
    { kind: 'action', action_key: 'email_send', cfg: { template: 'welcome' } },
    { kind: 'action', action_key: 'task_create', cfg: { assignee: 'sales_team' } },
  ],
  triggers: ['lead_sources_db_change'],
});
```

#### **👤 User Perspective**

- **Visual Workflow Builder**: Drag-and-drop interface for creating workflows without coding
- **Pre-built Action Library**: Access to ready-made actions (send email, create task, etc.)
- **Template-Based Creation**: Start from workflow templates for common business processes
- **Simple Configuration**: User-friendly forms for configuring actions and triggers

### 🏗️ **System Architecture**

The system is built as an **Nx monorepo** with the following core services:

| **Service**              | **Purpose**                                           | **User Interaction**                                       |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| **🌐 API Service**       | Workflow management, user interface, configuration    | Primary user interface for creating and managing workflows |
| **⚙️ Worker Service**    | Workflow execution engine, step processing            | Background execution of user-created workflows             |
| **📅 Scheduler Service** | Webhook handling, cron scheduling, trigger management | Handles time-based and external triggers                   |
| **🎨 Web App**           | Frontend interface for visual workflow creation       | User-friendly workflow builder interface                   |

### 🔄 **Workflow Lifecycle**

1. **Design Time**: Users/developers create workflows with steps, connections, and configurations
2. **Subscription**: Workflows are linked to triggers (database events, webhooks, schedules)
3. **Runtime**: Events trigger workflow execution, steps are processed sequentially
4. **Monitoring**: Real-time tracking of execution status, results, and performance metrics

### 📦 **Shared Libraries**

- **`@leadsend/storage`**: Database entities and data access layer
- **`@leadsend/queue-v2`**: Message queuing and workflow orchestration
- **`@leadsend/workflow-engine`**: Core workflow execution logic
- **`@leadsend/frontend-shared`**: Reusable UI components

### 🚀 **Key Features**

- ✅ **Multi-Trigger Support**: Database changes, webhooks, scheduled events
- ✅ **Action Registry**: Extensible library of workflow actions
- ✅ **Credential Management**: Secure storage of API keys and authentication
- ✅ **Real-time Execution**: Immediate workflow processing with status tracking
- ✅ **Version Control**: Immutable workflow versions with rollback capability
- ✅ **Visual Builder**: User-friendly interface for non-technical users
- ✅ **Developer APIs**: Full programmatic control for technical teams

---

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
