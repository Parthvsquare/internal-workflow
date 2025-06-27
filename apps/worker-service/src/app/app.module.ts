import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowKafkaConsumer } from '../services/workflow-kafka.consumer';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, WorkflowKafkaConsumer],
})
export class AppModule {}
