import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';
import { QueueModule } from '@internal-workflow/queue-v2';

// Import all workflow entities
import {
  WorkflowDefinitionEntity,
  WorkflowRunEntity,
  StepRunEntity,
  WorkflowStepEntity,
  WorkflowVersionEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
  WorkflowVariableEntity,
  WebhookEndpointEntity,
  ScheduleTriggerEntity,
  TaskEntity,
} from '@internal-workflow/storage';

// Import workflow services
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowFilterService } from './workflow-filter.service';
import { WorkflowActionExecutor } from './workflow-action.executor';
import { WorkflowTriggerProcessor } from './workflow-trigger.processor';
import { WorkflowSubscriptionService } from './workflow-subscription.service';

const ENTITIES = [
  WorkflowDefinitionEntity,
  WorkflowRunEntity,
  StepRunEntity,
  WorkflowStepEntity,
  WorkflowVersionEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
  WorkflowVariableEntity,
  WebhookEndpointEntity,
  ScheduleTriggerEntity,
  TaskEntity,
];

const SERVICES = [
  WorkflowEngineService,
  WorkflowFilterService,
  WorkflowActionExecutor,
  WorkflowTriggerProcessor,
  WorkflowSubscriptionService,
];

@Module({
  imports: [
    InternalWorkflowStorageModule,
    QueueModule,
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: SERVICES,
  exports: [...SERVICES, TypeOrmModule],
})
export class WorkflowEngineModule {}
