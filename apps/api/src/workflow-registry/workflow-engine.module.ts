import { Module } from '@nestjs/common';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';
import { QueueModule } from '@internal-workflow/queue-v2';

import { WorkflowRegistryController } from './workflow-registry.controller';
import { WorkflowRegistryService } from './workflow-registry.service';

const SERVICES = [WorkflowRegistryService];

@Module({
  imports: [InternalWorkflowStorageModule, QueueModule],
  controllers: [WorkflowRegistryController],
  providers: [...SERVICES],
  exports: [...SERVICES],
})
export class WorkflowEngineModule {}
