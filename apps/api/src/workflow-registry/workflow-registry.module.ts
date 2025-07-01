import { Module } from '@nestjs/common';
import { WorkflowRegistryController } from './workflow-registry.controller';
import { WorkflowRegistryService } from './workflow-registry.service';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';

@Module({
  imports: [InternalWorkflowStorageModule],
  controllers: [WorkflowRegistryController],
  providers: [WorkflowRegistryService],
  exports: [WorkflowRegistryService],
})
export class WorkflowRegistryModule {}
