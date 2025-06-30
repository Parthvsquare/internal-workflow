import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowTriggerRegistryEntity } from './entity/workflow/trigger-registry.entity';
import {
  WorkflowCredentialTypeEntity,
  WorkflowUserCredentialEntity,
} from './entity/workflow/credential.entity';
import { WorkflowActionRegistryEntity } from './entity/workflow/action-registry.entity';
import { WorkflowStepEntity } from './entity/workflow/step.entity';
import { WorkflowVersionEntity } from './entity/workflow/version.entity';

import { WorkflowDefinitionEntity } from './entity/workflow/definition.entity';
import { WorkflowEdgeEntity } from './entity/workflow/edge.entity';
import { WorkflowLatestJsonEntity } from './entity/workflow/latest.json.view-entity';
import { WorkflowRunEntity } from './entity/workflow/run.entity';
import { StepRunEntity } from './entity/workflow/step.run.entity';
import { WorkflowSubscriptionEntity } from './entity/workflow/subscription.entity';
import { WorkflowVariableEntity } from './entity/workflow/variable.entity';
import { WebhookEndpointEntity } from './entity/workflow/webhook-endpoint.entity';
import { ScheduleTriggerEntity } from './entity/workflow/schedule-trigger.entity';
import { TaskEntity } from './entity';

export const ENTITY = [
  WorkflowTriggerRegistryEntity,
  WorkflowActionRegistryEntity,
  WorkflowCredentialTypeEntity,
  WorkflowUserCredentialEntity,
  WorkflowStepEntity,
  WorkflowVersionEntity,
  WorkflowDefinitionEntity,
  WorkflowEdgeEntity,
  WorkflowLatestJsonEntity,
  WorkflowRunEntity,
  StepRunEntity,
  WorkflowSubscriptionEntity,
  WorkflowVariableEntity,
  WebhookEndpointEntity,
  ScheduleTriggerEntity,
  TaskEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITY)],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class InternalWorkflowStorageModule {}
