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
import { WorkflowGenerationController } from './workflow-generation.controller';
import { WorkflowGenerationService } from './workflow-generation.service';

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
  controllers: [WorkflowGenerationController],
  providers: [WorkflowGenerationService],
  exports: [WorkflowGenerationService],
})
export class WorkflowGenerationModule {}
