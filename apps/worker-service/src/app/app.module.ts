import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from '@internal-workflow/queue-v2';
import {
  InternalWorkflowStorageModule,
  ENTITY,
} from '@internal-workflow/storage';
import { WorkflowEngineModule } from '@internal-workflow/workflow-engine';
import { WorkflowProcessorService } from '../services/workflow.processor.service';

// Database configuration (same as API service)
const databaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'mydb',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...databaseConfig,
      entities: [...ENTITY],
      logging: true,
    }),
    QueueModule,
    InternalWorkflowStorageModule,
    WorkflowEngineModule,
  ],
  controllers: [AppController],
  providers: [AppService, WorkflowProcessorService],
})
export class AppModule {}
