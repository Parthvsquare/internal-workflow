const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Test the complete lead source workflow flow
 */
async function testLeadSourceWorkflow() {
  console.log('🚀 Testing Lead Source Workflow Flow\n');

  try {
    // Step 1: Create a simple workflow that reacts to lead source changes
    console.log('1. Creating test workflow...');
    const workflowPayload = {
      name: 'Lead Source Change Handler',
      description: 'Test workflow for lead source database changes',
      segment: 'Marketing',
      trigger: {
        triggerKey: 'lead_sources_db_change',
        properties: {
          table: 'lead_sources',
          operations: ['INSERT', 'UPDATE'],
          monitor_columns: false,
        },
        filters: {
          combinator: 'OR',
          conditions: [
            {
              variable: '{{variable.operation}}',
              operator: 'equals',
              value: 'INSERT',
              type: 'string',
            },
            {
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
                  operator: 'not_equals',
                  value: '{{variable.before.is_active}}',
                  type: 'boolean',
                },
              ],
            },
          ],
        },
      },
      steps: [
        {
          name: 'Log Lead Source Change',
          kind: 'ACTION',
          actionKey: 'taskManagement',
          configuration: {
            resource: 'task',
            operation: 'create',
            parameters: {
              title:
                'Lead Source {{variable.operation}}: {{variable.after.name}}',
              description:
                'Lead source "{{variable.after.name}}" was {{variable.operation}}ed. Code: {{variable.after.code}}, Active: {{variable.after.is_active}}',
              status: 'pending',
              entityType: 'lead_sources',
              entityId: '{{variable.after.code}}',
            },
          },
        },
      ],
      edges: [
        {
          fromStep: 'trigger',
          toStep: 'Log Lead Source Change',
          branchKey: 'default',
        },
      ],
      isActive: true,
    };

    const workflowResponse = await axios.post(
      `${API_BASE_URL}/workflow-generation`,
      workflowPayload
    );
    const workflowId = workflowResponse.data.id;
    console.log(`✅ Created workflow: ${workflowId}\n`);

    // Step 2: Verify subscription was created
    console.log('2. Checking workflow subscriptions...');
    const subscriptionsResponse = await axios.get(
      `${API_BASE_URL}/workflow-registry/subscriptions/workflow/${workflowId}`
    );
    console.log(
      `✅ Found ${subscriptionsResponse.data.length} subscription(s)\n`
    );

    // Step 3: Simulate database changes
    console.log('3. Simulating database changes...');

    // You can run the SQL commands manually or via database connection
    console.log(`
    Now run these SQL commands in your PostgreSQL database to trigger the workflow:
    
    -- Insert new lead source
    INSERT INTO lead_sources (code, name, is_active, display_order) 
    VALUES ('test_social', 'Test Social Media', true, 10)
    ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
    
    -- Update lead source status
    UPDATE lead_sources 
    SET is_active = false,
        updated_at = NOW()
    WHERE code = 'test_social';
    
    -- Check Kafka topics and worker service logs to see if events are being processed
    `);

    // Step 4: Check workflow executions (if any)
    console.log('4. You can check workflow executions with:');
    console.log(
      `GET ${API_BASE_URL}/workflow-registry/executions/workflow/${workflowId}`
    );

    console.log('\n🎉 Test setup complete!');
    console.log('\nNext steps:');
    console.log(
      '1. Ensure Debezium connector is running and monitoring lead_sources table'
    );
    console.log('2. Ensure worker-service is consuming Kafka messages');
    console.log('3. Run the SQL commands above to trigger workflow');
    console.log('4. Check the logs to see workflow execution');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response?.status === 400) {
      console.log('\n💡 Common issues:');
      console.log(
        '- Make sure the trigger registry for "lead_sources_db_change" exists'
      );
      console.log(
        '- Check if the task management action registry is properly configured'
      );
      console.log('- Verify API server is running on port 3000');
    }
  }
}

/**
 * Test just the database operations without workflow
 */
async function testDatabaseOperations() {
  console.log('🗄️  Testing Database Operations Only\n');

  const dbOperations = [
    {
      name: 'Insert new lead source',
      sql: `INSERT INTO lead_sources (code, name, is_active, display_order) VALUES ('test_email', 'Test Email Campaign', true, 5);`,
    },
    {
      name: 'Update lead source name',
      sql: `UPDATE lead_sources SET name = 'Updated Email Campaign', updated_at = NOW() WHERE code = 'test_email';`,
    },
    {
      name: 'Deactivate lead source',
      sql: `UPDATE lead_sources SET is_active = false, updated_at = NOW() WHERE code = 'test_email';`,
    },
    {
      name: 'Reactivate lead source',
      sql: `UPDATE lead_sources SET is_active = true, updated_at = NOW() WHERE code = 'test_email';`,
    },
  ];

  console.log('Run these SQL commands one by one to test CDC events:\n');
  dbOperations.forEach((op, index) => {
    console.log(`${index + 1}. ${op.name}:`);
    console.log(`   ${op.sql}\n`);
  });

  console.log(
    'Each operation should generate a Kafka message that your worker-service can consume.'
  );
}

// Run the appropriate test
const testType = process.argv[2] || 'workflow';

if (testType === 'db') {
  testDatabaseOperations();
} else {
  testLeadSourceWorkflow();
}

// Usage:
// node scripts/test-complete-lead-source-workflow.js        # Test full workflow
// node scripts/test-complete-lead-source-workflow.js db     # Test just database operations
