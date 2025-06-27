import {
  ENTITY,
  InternalWorkflowStorageModule,
} from '@internal-workflow/storage';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { WorkflowRegistryModule } from '../workflow-registry/workflow-registry.module';
import { WorkflowGenerationModule } from '../workflow-generation/workflow-generation.module';

const MODULES = [
  InternalWorkflowStorageModule,
  WorkflowRegistryModule,
  WorkflowGenerationModule,
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
