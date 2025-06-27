import { Module } from '@nestjs/common';
import { QueueClient } from './client/queue.client';
import { QueueConfig } from './client/queue.config';
import { WorkflowConsumer } from './client/workflow.consumer';
import { WorkflowManager } from './managers/workflow.manager';
import { QUEUE_CLIENT } from './interface/queue.interface';
import { KAFKA, KAFKA_PRODUCER_NAME } from './interface/kafka.constant';
import { ClientsModule, Transport } from '@nestjs/microservices';

const IMPORTS = [
  ClientsModule.register([
    {
      name: KAFKA_PRODUCER_NAME,
      transport: Transport.KAFKA,
      options: {
        client: KAFKA.KAFKA_CLIENT,
      },
    },
  ]),
];

const PROVIDERS = [
  QueueConfig,
  QueueClient,
  WorkflowConsumer,
  WorkflowManager,
  { provide: QUEUE_CLIENT, useClass: QueueClient },
];

@Module({
  imports: [...IMPORTS],
  providers: [...PROVIDERS],
  exports: [...IMPORTS, ...PROVIDERS],
})
export class QueueModule {}
