import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowTriggerRegistryEntity } from './entity/workflow/workflow.trigger-registry.entity';
import {
  WorkflowCredentialTypeEntity,
  WorkflowUserCredentialEntity,
} from './entity/workflow/workflow.credential.entity';
import { WorkflowActionRegistryEntity } from './entity/workflow/workflow.action-registry.entity';
import { WorkflowStepEntity } from './entity/workflow/workflow.step.entity';
import { WorkflowVersionEntity } from './entity/workflow/workflow.version.entity';

import { WorkflowDefinitionEntity } from './entity/workflow/workflow.definition.entity';
import { WorkflowEdgeEntity } from './entity/workflow/workflow.edge.entity';
import { WorkflowLatestJsonEntity } from './entity/workflow/workflow.latest.json.view-entity';
import { WorkflowExecutionEntity } from './entity/workflow/workflow.run.entity';
import { StepExecutionEntity } from './entity/workflow/workflow.step.run.entity';
import { WorkflowSubscriptionEntity } from './entity/workflow/workflow.subscription.entity';
import { WorkflowVariableEntity } from './entity/workflow/workflow.variable.entity';
import { WebhookEndpointEntity } from './entity/workflow/workflow.webhook-endpoint.entity';
import { ScheduleTriggerEntity } from './entity/workflow/workflow.schedule-trigger.entity';
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
  WorkflowExecutionEntity,
  StepExecutionEntity,
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
