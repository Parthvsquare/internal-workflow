#!/usr/bin/env node

/**
 * Lead Source Activation Workflow Test Script
 *
 * This script demonstrates the complete workflow integration:
 * 1. Creates the workflow using the API
 * 2. Tests manual execution
 * 3. Validates task creation
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

const workflowPayload = {
  name: 'Lead Source Activation Workflow',
  description:
    'Automatically create setup tasks when lead sources are activated',
  segment: 'MARKETING',
  isActive: true,
  createdBy: 'test-script',

  trigger: {
    triggerKey: 'lead_sources_table_change',
    filters: {
      combinator: 'AND',
      conditions: [
        {
          variable: '{{variable.operation}}',
          operator: 'equals',
          value: 'UPDATE',
          type: 'string',
        },
        {
          variable: '{{variable.after.is_active}}',
          operator: 'equals',
          value: true,
          type: 'boolean',
        },
        {
          variable: '{{variable.before.is_active}}',
          operator: 'equals',
          value: false,
          type: 'boolean',
        },
      ],
    },
  },

  steps: [
    {
      name: 'create_setup_task',
      kind: 'action',
      actionKey: 'task_management',
      configuration: {
        resource: 'task',
        operation: 'create',
        parameters: {
          operation: 'create',
          title: 'Setup marketing campaign for {{variable.after.name}}',
          description: `Lead source '{{variable.after.name}}' ({{variable.after.code}}) has been activated.

Required actions:
1. Set up tracking codes
2. Configure lead routing
3. Create marketing materials
4. Test lead capture forms
5. Notify sales team

Lead Source Details:
- Code: {{variable.after.code}}
- Name: {{variable.after.name}}
- Display Order: {{variable.after.display_order}}
- Activated: {{variable.timestamp}}`,
          status: 'pending',
          priority: 'high',
          dueDateDynamic: '+1d',
          entityType: 'crm_leads',
          entityId: '{{variable.after.code}}',
          additionalData: {
            lead_source_code: '{{variable.after.code}}',
            lead_source_name: '{{variable.after.name}}',
            activation_date: '{{variable.timestamp}}',
            previous_status: '{{variable.before.is_active}}',
            workflow_trigger: 'lead_source_activation',
          },
        },
      },
    },
  ],

  edges: [],
};

const testTriggerData = {
  triggerData: {
    operation: 'UPDATE',
    table: 'lead_sources',
    timestamp: new Date().toISOString(),
    before: {
      code: 'SOCIAL_MEDIA',
      name: 'Social Media Campaign',
      is_active: false,
      display_order: 3,
    },
    after: {
      code: 'SOCIAL_MEDIA',
      name: 'Social Media Campaign',
      is_active: true,
      display_order: 3,
    },
  },
};

async function createWorkflow() {
  console.log('🚀 Creating Lead Source Activation Workflow...\n');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/workflows`,
      workflowPayload
    );

    console.log('✅ Workflow created successfully!');
    console.log(`📝 Workflow ID: ${response.data.id}`);
    console.log(`📅 Created At: ${response.data.createdAt}`);
    console.log(`🎯 Trigger Key: ${response.data.trigger.triggerKey}`);
    console.log(`⚙️  Steps Count: ${response.data.steps.length}`);
    console.log(`🔄 Version: ${response.data.latestVersion}\n`);

    return response.data;
  } catch (error) {
    console.error('❌ Failed to create workflow:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(
        `Message: ${error.response.data.message || error.response.data}`
      );

      if (error.response.status === 400) {
        console.log('\n💡 Tip: Make sure both registries are inserted:');
        console.log(
          '   psql -d your_db -f docs/sql/insert-lead-sources-trigger-registry.sql'
        );
        console.log(
          '   psql -d your_db -f docs/sql/insert-task-management-action-registry.sql'
        );
      }
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

async function testWorkflowExecution(workflowId) {
  console.log('🧪 Testing workflow execution...\n');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/workflows/${workflowId}/execute`,
      testTriggerData
    );

    console.log('✅ Workflow executed successfully!');
    console.log(`🏃 Run ID: ${response.data.runId}`);
    console.log(`✨ Success: ${response.data.success}`);

    if (response.data.taskCreated) {
      console.log(`📋 Task Created: ${response.data.taskCreated.id}`);
      console.log(`📌 Task Title: ${response.data.taskCreated.title}`);
      console.log(`⏰ Due Date: ${response.data.taskCreated.dueDate}`);
    }
    console.log();

    return response.data;
  } catch (error) {
    console.error('❌ Failed to execute workflow:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(
        `Message: ${error.response.data.message || error.response.data}`
      );
    } else {
      console.error(error.message);
    }
  }
}

async function validateWorkflow(workflowId) {
  console.log('🔍 Validating workflow configuration...\n');

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/workflows/${workflowId}`
    );
    const workflow = response.data;

    // Validate trigger configuration
    const triggerValid =
      workflow.trigger &&
      workflow.trigger.triggerKey === 'lead_sources_table_change' &&
      workflow.trigger.filters.conditions.length === 3;

    // Validate steps configuration
    const stepsValid =
      workflow.steps.length === 1 &&
      workflow.steps[0].actionKey === 'task_management' &&
      workflow.steps[0].configuration.parameters.operation === 'create';

    console.log(
      `🎯 Trigger Configuration: ${triggerValid ? '✅ Valid' : '❌ Invalid'}`
    );
    console.log(
      `⚙️  Steps Configuration: ${stepsValid ? '✅ Valid' : '❌ Invalid'}`
    );
    console.log(
      `🔄 Workflow Active: ${workflow.isActive ? '✅ Yes' : '❌ No'}`
    );
    console.log(`📊 Latest Version: v${workflow.latestVersion}\n`);

    if (triggerValid && stepsValid && workflow.isActive) {
      console.log(
        '🎉 Workflow validation successful! Ready for production use.\n'
      );
      return true;
    } else {
      console.log(
        '⚠️  Workflow validation failed. Please check configuration.\n'
      );
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to validate workflow:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(
        `Message: ${error.response.data.message || error.response.data}`
      );
    } else {
      console.error(error.message);
    }
    return false;
  }
}

async function main() {
  console.log('🧪 Lead Source Activation Workflow Test\n');
  console.log('This test demonstrates the complete integration between:');
  console.log('• Lead Sources Trigger Registry');
  console.log('• Task Management Action Registry');
  console.log('• Workflow Generation API\n');
  console.log('='.repeat(60) + '\n');

  // Step 1: Create workflow
  const workflow = await createWorkflow();

  // Step 2: Validate workflow
  const isValid = await validateWorkflow(workflow.id);

  if (isValid) {
    // Step 3: Test execution
    const execution = await testWorkflowExecution(workflow.id);

    if (execution && execution.success) {
      console.log('🏆 Complete workflow test successful!');
      console.log('\n📋 Next Steps:');
      console.log('1. Set up Debezium connector for lead_sources table');
      console.log('2. Configure workflow engine to process triggers');
      console.log('3. Monitor task creation in your task management system');
      console.log(
        `\n🔗 Workflow URL: ${API_BASE_URL}/api/workflows/${workflow.id}`
      );
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed. Check logs above for results.');
}

// Handle CLI execution
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  createWorkflow,
  testWorkflowExecution,
  validateWorkflow,
  workflowPayload,
  testTriggerData,
};
