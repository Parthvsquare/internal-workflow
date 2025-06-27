import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from '@internal-workflow/queue-v2';
import { WorkflowProcessorService } from '../services/workflow.processor.service';

@Module({
  imports: [QueueModule],
  controllers: [AppController],
  providers: [AppService, WorkflowProcessorService],
})
export class AppModule {}
