import { Module } from '@nestjs/common';
import { WorkflowRegistryController } from './workflow-registry.controller';
import { WorkflowRegistryService } from './workflow-registry.service';
import { WorkflowEngineModule } from './services/workflow-engine.module';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';

@Module({
  imports: [InternalWorkflowStorageModule, WorkflowEngineModule],
  controllers: [WorkflowRegistryController],
  providers: [WorkflowRegistryService],
  exports: [WorkflowRegistryService, WorkflowEngineModule],
})
export class WorkflowRegistryModule {}
