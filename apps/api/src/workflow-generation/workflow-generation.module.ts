import { Module } from '@nestjs/common';
import { WorkflowGenerationService } from './workflow-generation.service';

@Module({
  providers: [WorkflowGenerationService]
})
export class WorkflowGenerationModule {}
