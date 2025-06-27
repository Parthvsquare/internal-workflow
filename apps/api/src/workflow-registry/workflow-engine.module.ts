import { Module } from '@nestjs/common';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';
import { QueueModule } from '@internal-workflow/queue-v2';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { WorkflowTriggerProcessor } from './services/workflow-trigger.processor';
import { WorkflowActionExecutor } from './services/workflow-action.executor';
import { WorkflowFilterService } from './services/workflow-filter.service';
import { WorkflowRegistryController } from './workflow-registry.controller';
import { WorkflowRegistryService } from './workflow-registry.service';

const SERVICES = [
  WorkflowEngineService,
  WorkflowTriggerProcessor,
  WorkflowActionExecutor,
  WorkflowFilterService,
  WorkflowRegistryService,
];

@Module({
  imports: [InternalWorkflowStorageModule, QueueModule],
  controllers: [WorkflowRegistryController],
  providers: [...SERVICES],
  exports: [...SERVICES],
})
export class WorkflowEngineModule {}
