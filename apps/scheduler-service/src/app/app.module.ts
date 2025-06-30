import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  InternalWorkflowStorageModule,
  ENTITY,
} from '@internal-workflow/storage';
import { QueueModule } from '@internal-workflow/queue-v2';
import { WorkflowEngineModule } from '@internal-workflow/workflow-engine';
import { WebhookController } from '../webhook/webhook.controller';
import { WebhookService } from '../webhook/webhook.service';

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

const MODULES = [
  InternalWorkflowStorageModule,
  QueueModule,
  WorkflowEngineModule,
];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...databaseConfig,
      entities: [...ENTITY],
      logging: true,
    }),
    ...MODULES,
  ],
  controllers: [AppController, WebhookController],
  providers: [AppService, WebhookService],
})
export class AppModule {}
