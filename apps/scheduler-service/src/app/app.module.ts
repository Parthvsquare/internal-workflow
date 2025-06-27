import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';
import { QueueModule } from '@internal-workflow/queue-v2';

const MODULES = [InternalWorkflowStorageModule, QueueModule];

@Module({
  imports: [...MODULES],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
