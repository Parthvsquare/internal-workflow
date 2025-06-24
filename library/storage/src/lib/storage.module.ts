import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowTriggerRegistryEntity } from './entity/workflow/trigger-registry.entity';

export const ENTITY = [WorkflowTriggerRegistryEntity];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITY)],
  controllers: [],
  providers: [],
  exports: [],
})
export class InternalWorkflowStorageModule {}
