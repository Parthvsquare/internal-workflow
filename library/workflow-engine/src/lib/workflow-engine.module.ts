import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowRunEntity,
  WorkflowStepEntity,
  WorkflowVersionEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
  WorkflowVariableEntity,
  TaskEntity,
} from '@internal-workflow/storage';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { WorkflowFilterService } from './services/workflow-filter.service';
import { WorkflowActionExecutor } from './services/workflow-action.executor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinitionEntity,
      WorkflowRunEntity,
      WorkflowStepEntity,
      WorkflowVersionEntity,
      WorkflowActionRegistryEntity,
      WorkflowTriggerRegistryEntity,
      WorkflowSubscriptionEntity,
      WorkflowVariableEntity,
      TaskEntity,
    ]),
  ],
  providers: [
    WorkflowEngineService,
    WorkflowFilterService,
    WorkflowActionExecutor,
  ],
  exports: [
    WorkflowEngineService,
    WorkflowFilterService,
    WorkflowActionExecutor,
  ],
})
export class WorkflowEngineModule {}
