import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WorkflowDefinitionEntity,
  WorkflowVersionEntity,
  WorkflowStepEntity,
  WorkflowTriggerEntity,
  WorkflowEdgeEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
} from '@internal-workflow/storage';
import { WorkflowGenerationService } from './workflow-generation.service';
import { WorkflowGenerationController } from './workflow-generation.controller';

const ENTITIES = [
  WorkflowDefinitionEntity,
  WorkflowVersionEntity,
  WorkflowStepEntity,
  WorkflowTriggerEntity,
  WorkflowEdgeEntity,
  WorkflowActionRegistryEntity,
  WorkflowTriggerRegistryEntity,
];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  controllers: [WorkflowGenerationController],
  providers: [WorkflowGenerationService],
  exports: [WorkflowGenerationService],
})
export class WorkflowGenerationModule {}
