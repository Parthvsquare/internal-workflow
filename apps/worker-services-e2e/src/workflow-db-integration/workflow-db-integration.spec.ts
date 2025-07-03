import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowVersionEntity,
  WorkflowStepEntity,
  WorkflowSubscriptionEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowActionRegistryEntity,
  WorkflowExecutionEntity,
  StepExecutionEntity,
  TaskEntity,
  TaskStatus,
  TaskRelatedEntityType,
} from '@internal-workflow/storage';
import { WorkflowEngineService } from '@internal-workflow/workflow-engine';
import { WorkflowActionExecutor } from '@internal-workflow/workflow-engine';
import { WorkflowFilterService } from '@internal-workflow/workflow-engine';
import { WorkflowEngineModule } from '@internal-workflow/workflow-engine';

/**
 * Comprehensive Integration Test for Database Change Workflow
 *
 * This test demonstrates the complete flow when lead_sources.is_active changes:
 * 1. Database change event occurs (simulated)
 * 2. Workflow subscription matches the event
 * 3. Workflow executes and creates task
 * 4. All data persistence points are verified
 */
describe('Workflow Database Integration - Lead Source Activation', () => {
  let module: TestingModule;
  let workflowEngineService: WorkflowEngineService;
  let workflowActionExecutor: WorkflowActionExecutor;
  let workflowFilterService: WorkflowFilterService;

  // Repositories for data verification
  let workflowDefRepo: Repository<WorkflowDefinitionEntity>;
  let workflowVersionRepo: Repository<WorkflowVersionEntity>;
  let workflowStepRepo: Repository<WorkflowStepEntity>;
  let workflowSubscriptionRepo: Repository<WorkflowSubscriptionEntity>;
  let workflowTriggerRegistryRepo: Repository<WorkflowTriggerRegistryEntity>;
  let workflowActionRegistryRepo: Repository<WorkflowActionRegistryEntity>;
  let workflowRunRepo: Repository<WorkflowExecutionEntity>;
  let stepRunRepo: Repository<StepExecutionEntity>;
  let taskRepo: Repository<TaskEntity>;

  // Test data references
  let leadSourceTrigger: WorkflowTriggerRegistryEntity;
  let taskManagementAction: WorkflowActionRegistryEntity;
  let testWorkflow: WorkflowDefinitionEntity;
  let testWorkflowVersion: WorkflowVersionEntity;
  let testWorkflowStep: WorkflowStepEntity;
  let testSubscription: WorkflowSubscriptionEntity;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
          username: process.env.POSTGRES_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || 'postgres',
          database: process.env.POSTGRES_DB || 'mydb',
          entities: [
            WorkflowDefinitionEntity,
            WorkflowVersionEntity,
            WorkflowStepEntity,
            WorkflowSubscriptionEntity,
            WorkflowTriggerRegistryEntity,
            WorkflowActionRegistryEntity,
            WorkflowExecutionEntity,
            StepExecutionEntity,
            TaskEntity,
          ],
          synchronize: true,
        }),
        WorkflowEngineModule,
      ],
    }).compile();

    // Get services
    workflowEngineService = module.get<WorkflowEngineService>(
      WorkflowEngineService
    );
    workflowActionExecutor = module.get<WorkflowActionExecutor>(
      WorkflowActionExecutor
    );
    workflowFilterService = module.get<WorkflowFilterService>(
      WorkflowFilterService
    );

    // Get repositories
    workflowDefRepo = module.get('WorkflowDefinitionEntityRepository');
    workflowVersionRepo = module.get('WorkflowVersionEntityRepository');
    workflowStepRepo = module.get('WorkflowStepEntityRepository');
    workflowSubscriptionRepo = module.get(
      'WorkflowSubscriptionEntityRepository'
    );
    workflowTriggerRegistryRepo = module.get(
      'WorkflowTriggerRegistryEntityRepository'
    );
    workflowActionRegistryRepo = module.get(
      'WorkflowActionRegistryEntityRepository'
    );
    workflowRunRepo = module.get('WorkflowExecutionEntityRepository');
    stepRunRepo = module.get('StepExecutionEntityRepository');
    taskRepo = module.get('TaskEntityRepository');
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up previous test data
    await stepRunRepo.delete({});
    await workflowRunRepo.delete({});
    await taskRepo.delete({});
    await workflowSubscriptionRepo.delete({});
    await workflowStepRepo.delete({});
    await workflowVersionRepo.delete({});
    await workflowDefRepo.delete({});
    await workflowActionRegistryRepo.delete({});
    await workflowTriggerRegistryRepo.delete({});

    await setupTestData();
  });

  /**
   * Setup test data that mirrors the production schema
   */
  async function setupTestData() {
    console.log('\n🔧 Setting up test data...\n');

    // 1. Create Lead Source DB Change Trigger Registry
    leadSourceTrigger = await workflowTriggerRegistryRepo.save({
      key: 'lead_sources_db_change',
      name: 'leadSourcesDbChange',
      display_name: 'Lead Sources Database Change',
      description:
        'Triggers when lead sources table data changes (INSERT, UPDATE, DELETE)',
      category: 'database',
      event_source: 'debezium',
      version: 1,
      properties_schema: {
        properties: [
          {
            name: 'table',
            type: 'options',
            default: 'lead_sources',
            options: [{ name: 'Lead Sources', value: 'lead_sources' }],
            required: true,
            description: 'Database table to monitor',
            displayName: 'Table',
          },
        ],
      },
      filter_schema: {
        fields: [
          {
            name: 'operation',
            type: 'options',
            options: [
              { name: 'Insert', value: 'INSERT' },
              { name: 'Update', value: 'UPDATE' },
              { name: 'Delete', value: 'DELETE' },
            ],
            displayName: 'Operation Type',
          },
          {
            name: 'after.is_active',
            type: 'boolean',
            description: 'Filter by active status',
            displayName: 'Is Active',
          },
        ],
      },
      sample_payload: {
        UPDATE: {
          after: {
            code: 'WEB_FORM',
            name: 'Website Contact Form',
            is_active: true,
            display_order: 5,
          },
          table: 'lead_sources',
          before: {
            code: 'WEB_FORM',
            name: 'Website Form',
            is_active: false,
            display_order: 10,
          },
          operation: 'UPDATE',
          timestamp: '2024-01-15T11:45:00Z',
          changed_columns: ['name', 'is_active', 'display_order'],
        },
      },
      available_variables: {
        operation: {
          path: '{{variable.operation}}',
          type: 'string',
          example: 'UPDATE',
          description: 'Database operation performed',
        },
        'after.is_active': {
          path: '{{variable.after.is_active}}',
          type: 'boolean',
          description: 'New active status',
        },
        'before.is_active': {
          path: '{{variable.before.is_active}}',
          type: 'boolean',
          description: 'Previous active status',
        },
      },
      is_active: true,
    });

    console.log('✅ Created trigger registry:', leadSourceTrigger.key);

    // 2. Create Task Management Action Registry
    taskManagementAction = await workflowActionRegistryRepo.save({
      key: 'task_management',
      name: 'taskManagement',
      display_name: 'Task Management',
      description: 'Create, update, delete and manage tasks in the system',
      category: 'internal',
      execution_type: 'internal_function',
      version: 1,
      properties_schema: {
        properties: [
          {
            name: 'operation',
            type: 'options',
            default: 'create',
            options: [
              { name: 'Create Task', value: 'create' },
              { name: 'Update Task', value: 'update' },
              { name: 'Delete Task', value: 'delete' },
            ],
            required: true,
            displayName: 'Operation',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            displayName: 'Title',
            placeholder: 'Follow up with {{variable.lead_name}}',
          },
          {
            name: 'description',
            type: 'string',
            displayName: 'Description',
          },
        ],
      },
      credentials_schema: {},
      operation_schema: {
        task: {
          operations: ['create', 'update', 'delete'],
          displayName: 'Task',
        },
      },
      filter_schema: {},
      sample_payload: {
        create: {
          success: true,
          operation: 'create',
          data: {
            id: 'task-uuid',
            title: 'Follow up with John Doe',
            status: 'pending',
            priority: 'high',
          },
        },
      },
      is_active: true,
      group: ['action'],
    });

    console.log('✅ Created action registry:', taskManagementAction.key);

    // 3. Create Workflow Definition
    testWorkflow = await workflowDefRepo.save({
      name: 'Lead Source Activation Test Workflow',
      description: 'Test workflow for lead source activation',
      segment: 'MARKETING',
      category: 'automation',
      is_active: true,
      is_template: false,
      pinned: false,
    });

    console.log('✅ Created workflow definition:', testWorkflow.id);

    // 4. Create Workflow Version
    testWorkflowVersion = await workflowVersionRepo.save({
      workflow_id: testWorkflow.id,
      version_num: 1,
      s3_key: `s3://test-workflows/${testWorkflow.id}/v1.json`,
      inline_json: {
        name: 'Lead Source Activation Test Workflow',
        version: '1.0',
        description: 'Test workflow for lead source activation',
        steps: [],
        edges: [],
      },
    });

    console.log('✅ Created workflow version:', testWorkflowVersion.id);

    // 5. Create Workflow Step (Task Creation Action)
    testWorkflowStep = await workflowStepRepo.save({
      version_id: testWorkflowVersion.id,
      kind: 'action',
      action_key: 'task_management',
      name: 'create_activation_task',
      cfg: {
        operation: 'create',
        title: 'Setup lead source: {{variable.after.name}}',
        description:
          'Lead source "{{variable.after.name}}" ({{variable.after.code}}) has been activated. Please set up tracking and campaigns.',
        status: 'pending',
        priority: 'high',
        entityType: 'crm_leads',
        entityId: '{{variable.after.code}}',
        additionalData: {
          lead_source_code: '{{variable.after.code}}',
          lead_source_name: '{{variable.after.name}}',
          activation_timestamp: '{{variable.timestamp}}',
          workflow_trigger: 'lead_source_activation',
        },
      },
    });

    console.log('✅ Created workflow step:', testWorkflowStep.id);

    // 6. Update workflow version with root step
    await workflowVersionRepo.update(testWorkflowVersion.id, {
      root_step_id: testWorkflowStep.id,
    });

    // 7. Update workflow definition with latest version
    await workflowDefRepo.update(testWorkflow.id, {
      latest_ver_id: testWorkflowVersion.id,
    });

    // 8. Create Workflow Subscription (Links workflow to trigger with filters)
    testSubscription = await workflowSubscriptionRepo.save({
      workflow_id: testWorkflow.id,
      trigger_key: 'lead_sources_db_change',
      filter_conditions: {
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
      is_active: true,
    });

    console.log('✅ Created workflow subscription:', testSubscription.id);
    console.log('🎯 Test data setup complete!\n');
  }

  /**
   * MAIN TEST: Complete Database Change Flow
   * Tests the full flow from database change to task creation
   */
  describe('Complete Database Change Flow', () => {
    it('should process lead source activation and create task with complete data tracking', async () => {
      console.log('\n🚀 Starting Complete Database Change Flow Test\n');

      // ========================================
      // STEP 1: Simulate Database Change Event
      // ========================================
      console.log('📊 STEP 1: Simulating Database Change Event');

      const simulatedDbChangeEvent = {
        operation: 'UPDATE',
        table: 'lead_sources',
        timestamp: '2024-01-15T11:45:00Z',
        before: {
          code: 'EMAIL_CAMPAIGN',
          name: 'Email Campaign',
          is_active: false,
          display_order: 5,
        },
        after: {
          code: 'EMAIL_CAMPAIGN',
          name: 'Email Marketing Campaign',
          is_active: true, // 🔥 Key change: activated!
          display_order: 3,
        },
        changed_columns: ['name', 'is_active', 'display_order'],
      };

      console.log(
        '   Database Event:',
        JSON.stringify(simulatedDbChangeEvent, null, 2)
      );

      // ========================================
      // STEP 2: Process Trigger Event
      // ========================================
      console.log('\n📋 STEP 2: Processing Trigger Event');

      const triggerContext = {
        triggerType: 'database' as const,
        userId: 'test-user-123',
        executionMode: 'async' as const,
        variables: simulatedDbChangeEvent,
      };

      // This simulates the workflow engine processing the trigger
      const executionResult = await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        simulatedDbChangeEvent,
        triggerContext
      );

      console.log('   Trigger Processing Result:', executionResult);

      // ========================================
      // STEP 3: Verify Workflow Run Creation
      // ========================================
      console.log('\n📝 STEP 3: Verifying Workflow Run Creation');

      const workflowRuns = await workflowRunRepo.find({
        where: { workflow_id: testWorkflow.id },
        order: { created_at: 'DESC' },
      });

      expect(workflowRuns).toHaveLength(1);
      const workflowRun = workflowRuns[0];

      console.log('   Workflow Run Created:');
      console.log(`     ID: ${workflowRun.id}`);
      console.log(`     Status: ${workflowRun.status}`);
      console.log(`     Trigger Type: ${workflowRun.trigger_type}`);
      console.log(`     Execution Mode: ${workflowRun.execution_mode}`);
      console.log(`     Total Steps: ${workflowRun.total_steps}`);
      console.log(`     Completed Steps: ${workflowRun.completed_steps}`);
      console.log(
        `     Trigger Summary:`,
        JSON.stringify(workflowRun.trigger_summary, null, 2)
      );

      // Verify workflow run data
      expect(workflowRun.workflow_id).toBe(testWorkflow.id);
      expect(workflowRun.version_id).toBe(testWorkflowVersion.id);
      expect(workflowRun.trigger_type).toBe('database');
      expect(workflowRun.execution_mode).toBe('async');
      // expect(workflowRun.status).toBeIn(['SUCCESS', 'PENDING', 'RUNNING']);
      expect(workflowRun.trigger_summary).toMatchObject({
        operation: 'UPDATE',
        table: 'lead_sources',
        lead_source_activated: true,
      });

      // ========================================
      // STEP 4: Verify Step Run Creation
      // ========================================
      console.log('\n⚡ STEP 4: Verifying Step Run Creation');

      const stepRuns = await stepRunRepo.find({
        where: { run_id: workflowRun.id },
        order: { started_at: 'ASC' },
      });

      expect(stepRuns).toHaveLength(1);
      const stepRun = stepRuns[0];

      console.log('   Step Run Created:');
      console.log(`     Run ID: ${stepRun.run_id}`);
      console.log(`     Step ID: ${stepRun.step_id}`);
      console.log(`     Status: ${stepRun.status}`);
      console.log(`     Execution Time: ${stepRun.execution_time}ms`);
      console.log(
        `     Input Data:`,
        JSON.stringify(stepRun.input_data, null, 2)
      );
      console.log(
        `     Output Data:`,
        JSON.stringify(stepRun.output_data, null, 2)
      );

      // Verify step run data
      expect(stepRun.run_id).toBe(workflowRun.id);
      expect(stepRun.step_id).toBe(testWorkflowStep.id);
      expect(stepRun.status).toBe('SUCCESS');
      expect(stepRun.execution_time).toBeGreaterThan(0);

      // ========================================
      // STEP 5: Verify Task Creation
      // ========================================
      console.log('\n📋 STEP 5: Verifying Task Creation');

      const tasks = await taskRepo.find({
        order: { createdAt: 'DESC' },
      });

      expect(tasks).toHaveLength(1);
      const createdTask = tasks[0];

      console.log('   Task Created:');
      console.log(`     ID: ${createdTask.entityId}`);
      console.log(`     Title: ${createdTask.title}`);
      console.log(`     Description: ${createdTask.description}`);
      console.log(`     Status: ${createdTask.status}`);
      console.log(`     Entity Type: ${createdTask.entityType}`);
      console.log(`     Entity ID: ${createdTask.entityId}`);
      console.log(`     Due Date: ${createdTask.dueDate}`);
      console.log(`     Created At: ${createdTask.createdAt}`);

      // Verify task data with variable replacement
      expect(createdTask.title).toBe(
        'Setup lead source: Email Marketing Campaign'
      );
      expect(createdTask.description).toContain('Email Marketing Campaign');
      expect(createdTask.description).toContain('EMAIL_CAMPAIGN');
      expect(createdTask.description).toContain('has been activated');
      expect(createdTask.status).toBe(TaskStatus.PENDING);
      expect(createdTask.entityType).toBe(TaskRelatedEntityType.CRM_LEAD);
      expect(createdTask.dueDate).toBeDefined();

      // ========================================
      // STEP 6: Verify Complete Data Chain
      // ========================================
      console.log('\n🔗 STEP 6: Verifying Complete Data Chain');

      // Verify the complete data chain from trigger to task
      const completeChain = {
        trigger: {
          key: leadSourceTrigger.key,
          event_source: leadSourceTrigger.event_source,
          is_active: leadSourceTrigger.is_active,
        },
        subscription: {
          workflow_id: testSubscription.workflow_id,
          trigger_key: testSubscription.trigger_key,
          filter_conditions: testSubscription.filter_conditions,
          is_active: testSubscription.is_active,
        },
        workflow: {
          id: testWorkflow.id,
          name: testWorkflow.name,
          is_active: testWorkflow.is_active,
          latest_ver_id: testWorkflow.latest_ver_id,
        },
        workflow_version: {
          id: testWorkflowVersion.id,
          version_num: testWorkflowVersion.version_num,
          root_step_id: testWorkflowVersion.root_step_id,
        },
        workflow_step: {
          id: testWorkflowStep.id,
          kind: testWorkflowStep.kind,
          action_key: testWorkflowStep.action_key,
          name: testWorkflowStep.name,
        },
        workflow_run: {
          id: workflowRun.id,
          status: workflowRun.status,
          trigger_type: workflowRun.trigger_type,
          total_steps: workflowRun.total_steps,
          completed_steps: workflowRun.completed_steps,
        },
        step_run: {
          run_id: stepRun.run_id,
          step_id: stepRun.step_id,
          status: stepRun.status,
          execution_time: stepRun.execution_time,
        },
        task: {
          id: createdTask.entityId,
          title: createdTask.title,
          status: createdTask.status,
          entityType: createdTask.entityType,
        },
      };

      console.log('   Complete Data Chain:');
      console.log(JSON.stringify(completeChain, null, 2));

      // Verify data consistency across the chain
      expect(completeChain.subscription.workflow_id).toBe(
        completeChain.workflow.id
      );
      expect(completeChain.workflow.latest_ver_id).toBe(
        completeChain.workflow_version.id
      );
      expect(completeChain.workflow_version.root_step_id).toBe(
        completeChain.workflow_step.id
      );
      expect(completeChain.workflow_run.id).toBe(completeChain.step_run.run_id);
      expect(completeChain.workflow_step.id).toBe(
        completeChain.step_run.step_id
      );

      console.log('\n✅ Complete Database Change Flow Test PASSED!\n');
    });
  });

  /**
   * Test different is_active change scenarios
   */
  describe('Different is_active Change Scenarios', () => {
    it('should handle activation (false -> true)', async () => {
      const eventData = {
        operation: 'UPDATE',
        table: 'lead_sources',
        before: { code: 'TEST', name: 'Test', is_active: false },
        after: { code: 'TEST', name: 'Test', is_active: true },
        changed_columns: ['is_active'],
        timestamp: new Date().toISOString(),
      };

      const result = await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        eventData,
        { triggerType: 'database', userId: 'test', executionMode: 'async' }
      );

      expect(result.success).toBe(true);

      const tasks = await taskRepo.find();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toContain('Test');
    });

    it('should NOT trigger on deactivation (true -> false)', async () => {
      const eventData = {
        operation: 'UPDATE',
        table: 'lead_sources',
        before: { code: 'TEST', name: 'Test', is_active: true },
        after: { code: 'TEST', name: 'Test', is_active: false },
        changed_columns: ['is_active'],
        timestamp: new Date().toISOString(),
      };

      const result = await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        eventData,
        { triggerType: 'database', userId: 'test', executionMode: 'async' }
      );

      // Should not match filters (we only trigger on activation)
      const tasks = await taskRepo.find();
      expect(tasks).toHaveLength(0);
    });

    it('should NOT trigger on INSERT (new record)', async () => {
      const eventData = {
        operation: 'INSERT',
        table: 'lead_sources',
        before: null,
        after: { code: 'NEW', name: 'New Source', is_active: true },
        changed_columns: null,
        timestamp: new Date().toISOString(),
      };

      const result = await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        eventData,
        { triggerType: 'database', userId: 'test', executionMode: 'async' }
      );

      // Should not match filters (we only trigger on UPDATE)
      const tasks = await taskRepo.find();
      expect(tasks).toHaveLength(0);
    });
  });

  /**
   * Test task data verification with different lead source scenarios
   */
  describe('Task Data Verification', () => {
    it('should create task with correct variable substitution', async () => {
      const eventData = {
        operation: 'UPDATE',
        table: 'lead_sources',
        before: {
          code: 'SOCIAL_MEDIA',
          name: 'Social Media',
          is_active: false,
          display_order: 10,
        },
        after: {
          code: 'SOCIAL_MEDIA',
          name: 'Social Media Campaigns',
          is_active: true,
          display_order: 2,
        },
        changed_columns: ['name', 'is_active', 'display_order'],
        timestamp: '2024-01-15T14:30:00Z',
      };

      await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        eventData,
        { triggerType: 'database', userId: 'test-user', executionMode: 'async' }
      );

      const task = await taskRepo.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      expect(task).toBeDefined();
      expect(task?.title).toBe('Setup lead source: Social Media Campaigns');
      expect(task?.description).toContain('Social Media Campaigns');
      expect(task?.description).toContain('SOCIAL_MEDIA');
      expect(task?.description).toContain('has been activated');
      expect(task?.status).toBe(TaskStatus.PENDING);
      expect(task?.entityType).toBe(TaskRelatedEntityType.CRM_LEAD);
    });

    it('should create task with due date when dueDateDynamic is specified', async () => {
      // Update the test workflow step to include dueDateDynamic
      await workflowStepRepo.update(testWorkflowStep.id, {
        cfg: {
          ...testWorkflowStep.cfg,
          dueDateDynamic: () => '+1d', // 1 day from now
        },
      });

      const eventData = {
        operation: 'UPDATE',
        table: 'lead_sources',
        before: { code: 'TEST_DUE', name: 'Test Due', is_active: false },
        after: { code: 'TEST_DUE', name: 'Test Due', is_active: true },
        changed_columns: ['is_active'],
        timestamp: new Date().toISOString(),
      };

      await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        eventData,
        { triggerType: 'database', userId: 'test', executionMode: 'async' }
      );

      const task = await taskRepo.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      expect(task).toBeDefined();
      expect(task?.dueDate).toBeDefined();

      // Verify due date is approximately 1 day from now
      const now = new Date();
      const expectedDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
      const timeDiff = Math.abs(
        (task?.dueDate?.getTime() || 0) - expectedDueDate.getTime()
      );
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute tolerance
    });
  });

  /**
   * Test error scenarios and data consistency
   */
  describe('Error Scenarios and Data Consistency', () => {
    it('should handle workflow execution errors gracefully', async () => {
      // Create a workflow step with invalid action key
      const invalidStep = await workflowStepRepo.save({
        version_id: testWorkflowVersion.id,
        kind: 'action',
        action_key: 'invalid_action',
        name: 'invalid_step',
        cfg: { operation: 'test' },
      });

      // Update workflow version to use invalid step
      await workflowVersionRepo.update(testWorkflowVersion.id, {
        root_step_id: invalidStep.id,
      });

      const eventData = {
        operation: 'UPDATE',
        table: 'lead_sources',
        before: { code: 'ERROR_TEST', name: 'Error Test', is_active: false },
        after: { code: 'ERROR_TEST', name: 'Error Test', is_active: true },
        changed_columns: ['is_active'],
        timestamp: new Date().toISOString(),
      };

      const result = await workflowEngineService.processTriggerEvent(
        'lead_sources_db_change',
        eventData,
        { triggerType: 'database', userId: 'test', executionMode: 'async' }
      );

      // Should still create workflow run but with failed status
      const workflowRuns = await workflowRunRepo.find({
        where: { workflow_id: testWorkflow.id },
        order: { created_at: 'DESC' },
      });

      expect(workflowRuns).toHaveLength(1);
      expect(workflowRuns[0].status).toBe('FAILED');

      // Should create step run with failed status
      const stepRuns = await stepRunRepo.find({
        where: { run_id: workflowRuns[0].id },
      });

      expect(stepRuns).toHaveLength(1);
      expect(stepRuns[0].status).toBe('FAILED');
      expect(stepRuns[0].error_message).toContain('Action registry not found');

      // Should not create any tasks
      const tasks = await taskRepo.find();
      expect(tasks).toHaveLength(0);
    });
  });
});

/**
 * Custom Jest matchers for better test readability
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeIn(values: any[]): R;
    }
  }
}

expect.extend({
  toBeIn(received, values) {
    const pass = values.includes(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be in [${values.join(', ')}]`
          : `expected ${received} to be in [${values.join(', ')}]`,
      pass,
    };
  },
});
