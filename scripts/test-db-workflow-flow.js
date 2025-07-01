#!/usr/bin/env node

/**
 * Test Script: Database Change Workflow Flow
 *
 * This script demonstrates what happens when lead_sources.is_active changes:
 * 1. Database change event (simulated)
 * 2. What data gets saved in each table
 * 3. Final task creation with all the data
 */

console.log('🔄 DATABASE CHANGE WORKFLOW FLOW DEMONSTRATION\n');

// ========================================
// STEP 1: Simulate Database Change Event
// ========================================
console.log('📊 STEP 1: Database Change Event (Debezium/CDC Format)');
console.log('─'.repeat(60));

const databaseChangeEvent = {
  operation: 'UPDATE',
  table: 'lead_sources',
  timestamp: '2024-01-15T11:45:00Z',

  // BEFORE state (is_active = false)
  before: {
    code: 'EMAIL_CAMPAIGN',
    name: 'Email Campaign',
    is_active: false, // 🔴 WAS INACTIVE
    display_order: 5,
  },

  // AFTER state (is_active = true)
  after: {
    code: 'EMAIL_CAMPAIGN',
    name: 'Email Marketing Campaign',
    is_active: true, // 🟢 NOW ACTIVE!
    display_order: 3,
  },

  changed_columns: ['name', 'is_active', 'display_order'],
};

console.log('Database Event Details:');
console.log(JSON.stringify(databaseChangeEvent, null, 2));

// ========================================
// STEP 2: Workflow Registry Lookup
// ========================================
console.log('\n📋 STEP 2: Workflow Registry Data');
console.log('─'.repeat(60));

const triggerRegistry = {
  table: 'workflow_trigger_registry',
  data: {
    id: 'trigger-uuid-123',
    key: 'lead_sources_db_change',
    name: 'leadSourcesDbChange',
    display_name: 'Lead Sources Database Change',
    event_source: 'debezium',
    is_active: true,
    available_variables: {
      operation: '{{variable.operation}}',
      'after.is_active': '{{variable.after.is_active}}',
      'before.is_active': '{{variable.before.is_active}}',
      'after.code': '{{variable.after.code}}',
      'after.name': '{{variable.after.name}}',
    },
  },
};

console.log('Trigger Registry Entry:');
console.log(JSON.stringify(triggerRegistry, null, 2));

// ========================================
// STEP 3: Workflow Subscription Matching
// ========================================
console.log('\n🎯 STEP 3: Workflow Subscription Matching');
console.log('─'.repeat(60));

const workflowSubscription = {
  table: 'workflow_subscription',
  data: {
    id: 'subscription-uuid-456',
    workflow_id: 'workflow-uuid-789',
    trigger_key: 'lead_sources_db_change',
    filter_conditions: {
      combinator: 'AND',
      conditions: [
        {
          variable: '{{variable.operation}}',
          operator: 'equals',
          value: 'UPDATE', // ✅ MATCHES: operation = 'UPDATE'
          type: 'string',
        },
        {
          variable: '{{variable.after.is_active}}',
          operator: 'equals',
          value: true, // ✅ MATCHES: after.is_active = true
          type: 'boolean',
        },
        {
          variable: '{{variable.before.is_active}}',
          operator: 'equals',
          value: false, // ✅ MATCHES: before.is_active = false
          type: 'boolean',
        },
      ],
    },
    is_active: true,
  },
};

console.log('Subscription Filter Check:');
console.log(JSON.stringify(workflowSubscription, null, 2));

// Check if filters match
const filtersMatch =
  databaseChangeEvent.operation === 'UPDATE' && // ✅
  databaseChangeEvent.after.is_active === true && // ✅
  databaseChangeEvent.before.is_active === false; // ✅

console.log(
  `\n🎯 Filter Match Result: ${filtersMatch ? '✅ PASS' : '❌ FAIL'}`
);

// ========================================
// STEP 4: Workflow Execution Data
// ========================================
console.log('\n⚙️ STEP 4: Workflow Execution Tables');
console.log('─'.repeat(60));

const workflowDefinition = {
  table: 'workflow_definition',
  data: {
    id: 'workflow-uuid-789',
    name: 'Lead Source Activation Workflow',
    segment: 'MARKETING',
    is_active: true,
    latest_ver_id: 'version-uuid-abc',
  },
};

const workflowVersion = {
  table: 'workflow_version',
  data: {
    id: 'version-uuid-abc',
    workflow_id: 'workflow-uuid-789',
    version_num: 1,
    s3_key: 's3://workflows/workflow-uuid-789/v1.json',
    root_step_id: 'step-uuid-def',
  },
};

const workflowStep = {
  table: 'workflow_step',
  data: {
    id: 'step-uuid-def',
    version_id: 'version-uuid-abc',
    kind: 'action',
    action_key: 'task_management',
    name: 'create_activation_task',
    cfg: {
      operation: 'create',
      title: 'Setup lead source: {{variable.after.name}}', // Variable placeholder
      description:
        'Lead source "{{variable.after.name}}" ({{variable.after.code}}) has been activated.',
      status: 'pending',
      priority: 'high',
      entityType: 'crm_leads',
      entityId: '{{variable.after.code}}', // Variable placeholder
      additionalData: {
        lead_source_code: '{{variable.after.code}}',
        lead_source_name: '{{variable.after.name}}',
        activation_timestamp: '{{variable.timestamp}}',
      },
    },
  },
};

console.log('Workflow Definition:');
console.log(JSON.stringify(workflowDefinition, null, 2));
console.log('\nWorkflow Version:');
console.log(JSON.stringify(workflowVersion, null, 2));
console.log('\nWorkflow Step Configuration:');
console.log(JSON.stringify(workflowStep, null, 2));

// ========================================
// STEP 5: Runtime Execution Tracking
// ========================================
console.log('\n🏃 STEP 5: Runtime Execution Tracking Tables');
console.log('─'.repeat(60));

const workflowRun = {
  table: 'workflow_run',
  data: {
    id: 'run-uuid-ghi',
    workflow_id: 'workflow-uuid-789',
    version_id: 'version-uuid-abc',
    trigger_event_id: 'event-123',
    trigger_type: 'database',
    execution_mode: 'async',
    status: 'SUCCESS',
    total_steps: 1,
    completed_steps: 1,
    failed_steps: 0,
    execution_time: 1250, // ms
    started_at: '2024-01-15T11:45:01Z',
    ended_at: '2024-01-15T11:45:02Z',
    trigger_summary: {
      operation: 'UPDATE',
      table: 'lead_sources',
      lead_source_activated: true,
      lead_source_code: 'EMAIL_CAMPAIGN',
      lead_source_name: 'Email Marketing Campaign',
    },
    context_data: databaseChangeEvent,
  },
};

const stepRun = {
  table: 'step_run',
  data: {
    run_id: 'run-uuid-ghi', // Links to workflow_run
    step_id: 'step-uuid-def', // Links to workflow_step
    status: 'SUCCESS',
    started_at: '2024-01-15T11:45:01Z',
    ended_at: '2024-01-15T11:45:02Z',
    execution_time: 1180, // ms
    input_data: {
      // Processed config with variables replaced
      operation: 'create',
      title: 'Setup lead source: Email Marketing Campaign', // ✅ Variable replaced
      description:
        'Lead source "Email Marketing Campaign" (EMAIL_CAMPAIGN) has been activated.',
      status: 'pending',
      priority: 'high',
      entityType: 'crm_leads',
      entityId: 'EMAIL_CAMPAIGN', // ✅ Variable replaced
    },
    output_data: {
      success: true,
      task_id: 'task-uuid-jkl',
      operation: 'create',
    },
    retry_count: 0,
    max_retries: 3,
  },
};

console.log('Workflow Run Entry:');
console.log(JSON.stringify(workflowRun, null, 2));
console.log('\nStep Run Entry:');
console.log(JSON.stringify(stepRun, null, 2));

// ========================================
// STEP 6: FINAL TASK CREATION
// ========================================
console.log('\n📋 STEP 6: FINAL TASK ENTITY DATA');
console.log('─'.repeat(60));

const finalTaskEntity = {
  table: 'tasks',
  data: {
    entityId: 'task-uuid-jkl', // Primary key

    // ✅ PROCESSED TITLE (variables replaced)
    title: 'Setup lead source: Email Marketing Campaign',

    // ✅ PROCESSED DESCRIPTION (variables replaced)
    description:
      'Lead source "Email Marketing Campaign" (EMAIL_CAMPAIGN) has been activated. Please set up tracking and campaigns.',

    // Task metadata
    status: 'PENDING', // TaskStatus enum
    entityType: 'CRM_LEAD', // TaskRelatedEntityType enum
    entityId: 'EMAIL_CAMPAIGN', // ✅ Variable replaced
    dueDate: '2024-01-16T11:45:02Z', // +1 day from creation
    createdAt: '2024-01-15T11:45:02Z',
    updatedAt: '2024-01-15T11:45:02Z',
  },
};

console.log('🎯 FINAL TASK ENTITY SAVED TO DATABASE:');
console.log(JSON.stringify(finalTaskEntity, null, 2));

// ========================================
// STEP 7: DATA FLOW SUMMARY
// ========================================
console.log('\n📊 STEP 7: COMPLETE DATA FLOW SUMMARY');
console.log('─'.repeat(60));

const dataFlowSummary = {
  input: {
    table_change: 'lead_sources.is_active: false → true',
    operation: databaseChangeEvent.operation,
    lead_source: `${databaseChangeEvent.after.code} (${databaseChangeEvent.after.name})`,
  },

  processing: {
    trigger_matched: 'lead_sources_db_change',
    filters_passed: filtersMatch,
    workflow_executed: 'Lead Source Activation Workflow',
    action_performed: 'task_management.create',
  },

  data_saved: {
    workflow_run_table: '1 record (execution tracking)',
    step_run_table: '1 record (step execution details)',
    tasks_table: '1 record (final task created)',
  },

  output: {
    task_created: true,
    task_id: finalTaskEntity.data.entityId,
    task_title: finalTaskEntity.data.title,
    variables_processed: {
      '{{variable.after.name}}': 'Email Marketing Campaign',
      '{{variable.after.code}}': 'EMAIL_CAMPAIGN',
      '{{variable.timestamp}}': databaseChangeEvent.timestamp,
    },
  },
};

console.log('📈 COMPLETE FLOW SUMMARY:');
console.log(JSON.stringify(dataFlowSummary, null, 2));

// ========================================
// STEP 8: DATABASE TABLES AFFECTED
// ========================================
console.log('\n💾 STEP 8: DATABASE TABLES AFFECTED');
console.log('─'.repeat(60));

const tablesAffected = [
  {
    table: 'workflow_trigger_registry',
    operation: 'READ',
    description: 'Lookup trigger by key to get configuration',
    records: 1,
  },
  {
    table: 'workflow_subscription',
    operation: 'READ',
    description: 'Find workflows subscribed to this trigger',
    records: 1,
  },
  {
    table: 'workflow_definition',
    operation: 'READ',
    description: 'Get workflow metadata and latest version',
    records: 1,
  },
  {
    table: 'workflow_version',
    operation: 'READ',
    description: 'Get workflow steps and configuration',
    records: 1,
  },
  {
    table: 'workflow_step',
    operation: 'READ',
    description: 'Get step configuration and action details',
    records: 1,
  },
  {
    table: 'workflow_action_registry',
    operation: 'READ',
    description: 'Get action executor configuration',
    records: 1,
  },
  {
    table: 'workflow_run',
    operation: 'INSERT',
    description: '🔥 CREATE execution tracking record',
    records: 1,
  },
  {
    table: 'step_run',
    operation: 'INSERT',
    description: '🔥 CREATE step execution record',
    records: 1,
  },
  {
    table: 'tasks',
    operation: 'INSERT',
    description: '🔥 CREATE the final task entity',
    records: 1,
  },
];

tablesAffected.forEach((table, index) => {
  const icon = table.operation === 'INSERT' ? '🔥' : '👁️';
  console.log(`${index + 1}. ${icon} ${table.table}`);
  console.log(`   Operation: ${table.operation}`);
  console.log(`   Description: ${table.description}`);
  console.log(`   Records: ${table.records}`);
  console.log('');
});

console.log('✅ DEMONSTRATION COMPLETE!\n');
console.log(
  '🎯 KEY TAKEAWAY: When lead_sources.is_active changes from false to true:'
);
console.log('   • Workflow system detects the change via subscription filters');
console.log(
  '   • Creates tracking records in workflow_run and step_run tables'
);
console.log('   • Processes template variables from the database change event');
console.log(
  '   • Creates a final task in the tasks table with all data populated'
);
console.log('');
