import {
  WorkflowActionRegistryEntity,
  WorkflowDefinitionEntity,
  WorkflowEdgeEntity,
  WorkflowStepEntity,
  WorkflowSubscriptionEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowVersionEntity,
} from '@internal-workflow/storage';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowBuilderController } from './workflow-builder.controller';
import { WorkflowBuilderService } from './workflow-builder.service';

const ENTITIES = [
  WorkflowDefinitionEntity,
  WorkflowVersionEntity,
  WorkflowStepEntity,
  WorkflowEdgeEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
  WorkflowSubscriptionEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  controllers: [WorkflowBuilderController],
  providers: [WorkflowBuilderService],
  exports: [WorkflowBuilderService],
})
export class WorkflowBuilderModule {}
