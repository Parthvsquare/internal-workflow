import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowTriggerRegistryEntity } from './entity/workflow/trigger-registry.entity';
import {
  WorkflowCredentialTypeEntity,
  WorkflowUserCredentialEntity,
} from './entity/workflow/credential.entity';
import { WorkflowActionRegistryEntity } from './entity/workflow/action-registry.entity';
import { WorkflowStepEntity } from './entity/workflow/step.entity';
import { WorkflowVersionEntity } from './entity/workflow/version';
import { WorkflowActionEntity } from './entity/workflow/action';
import { WorkflowTriggerEntity } from './entity/workflow/trigger';
import { WorkflowDefinitionEntity } from './entity/workflow/definition';
import { WorkflowLatestJsonEntity } from './entity/workflow/latest.json';
import { DailyWorkflowMetricsEntity } from './entity/workflow/daily.metrics';
import { ExecutionLogEntity } from './entity/workflow/execution.log';
import { WorkflowRunEntity } from './entity/workflow/run';
import { StepRunEntity } from './entity/workflow/step.run';
import { TaskEntity } from './entity';

export const ENTITY = [
  WorkflowTriggerRegistryEntity,
  WorkflowActionRegistryEntity,
  WorkflowCredentialTypeEntity,
  WorkflowUserCredentialEntity,
  WorkflowStepEntity,
  WorkflowActionEntity,
  WorkflowTriggerEntity,
  WorkflowVersionEntity,
  WorkflowDefinitionEntity,
  WorkflowLatestJsonEntity,
  DailyWorkflowMetricsEntity,
  ExecutionLogEntity,
  WorkflowRunEntity,
  StepRunEntity,
  TaskEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITY)],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class InternalWorkflowStorageModule {}
