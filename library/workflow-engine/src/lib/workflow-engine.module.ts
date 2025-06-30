import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowExecutionEntity,
  WorkflowStepEntity,
  WorkflowVersionEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
  WorkflowVariableEntity,
  TaskEntity,
  StepExecutionEntity,
} from '@internal-workflow/storage';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { WorkflowFilterService } from './services/workflow-filter.service';
import { WorkflowActionExecutor } from './services/workflow-action.executor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinitionEntity,
      WorkflowExecutionEntity,
      WorkflowStepEntity,
      WorkflowVersionEntity,
      WorkflowActionRegistryEntity,
      WorkflowTriggerRegistryEntity,
      WorkflowSubscriptionEntity,
      WorkflowVariableEntity,
      TaskEntity,
      StepExecutionEntity,
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
