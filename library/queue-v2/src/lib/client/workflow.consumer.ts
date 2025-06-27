import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { KAFKA } from '../interface/kafka.constant';
import { DatabaseChangeEvent, WorkflowMessage } from '../message/message.type';

@Injectable()
export class WorkflowConsumer implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private kafka: Kafka;
  private readonly consumerGroup: string = 'workflow-engine';

  constructor() {
    this.kafka = new Kafka(KAFKA.KAFKA_CLIENT);
    this.consumer = this.kafka.consumer({ groupId: this.consumerGroup });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    console.log(
      `[WorkflowConsumer] Connected to Kafka with consumer group: ${this.consumerGroup}`
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    console.log('[WorkflowConsumer] Disconnected from Kafka');
  }

  async subscribeToWorkflowTriggers(
    callback: (message: WorkflowMessage) => Promise<void>,
    topic = 'workflow.trigger'
  ): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const workflowMessage: WorkflowMessage = {
            topic,
            key: message.key?.toString() || '',
            payload: JSON.parse(message.value?.toString() || '{}'),
            headers: this.parseHeaders(message.headers),
          };

          await callback(workflowMessage);
          console.log(
            `[WorkflowConsumer] Processed workflow trigger message from topic: ${topic}`
          );
        } catch (error) {
          console.error(
            `[WorkflowConsumer] Error processing workflow trigger:`,
            error
          );
        }
      },
    });
  }

  async subscribeToWorkflowActions(
    callback: (message: WorkflowMessage) => Promise<void>,
    topic = 'workflow.action'
  ): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const workflowMessage: WorkflowMessage = {
            topic,
            key: message.key?.toString() || '',
            payload: JSON.parse(message.value?.toString() || '{}'),
            headers: this.parseHeaders(message.headers),
          };

          await callback(workflowMessage);
          console.log(
            `[WorkflowConsumer] Processed workflow action message from topic: ${topic}`
          );
        } catch (error) {
          console.error(
            `[WorkflowConsumer] Error processing workflow action:`,
            error
          );
        }
      },
    });
  }

  async subscribeToDatabaseChanges(
    callback: (event: DatabaseChangeEvent) => Promise<void>,
    topic = 'database.change'
  ): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const changeEvent: DatabaseChangeEvent = JSON.parse(
            message.value?.toString() || '{}'
          );

          await callback(changeEvent);
          console.log(
            `[WorkflowConsumer] Processed database change event from topic: ${topic}`
          );
        } catch (error) {
          console.error(
            `[WorkflowConsumer] Error processing database change:`,
            error
          );
        }
      },
    });
  }

  private parseHeaders(headers: any): Record<string, string> {
    const parsedHeaders: Record<string, string> = {};

    if (headers) {
      Object.keys(headers).forEach((key) => {
        const value = headers[key];
        parsedHeaders[key] = value?.toString() || '';
      });
    }

    return parsedHeaders;
  }

  async commitOffsets(): Promise<void> {
    await this.consumer.commitOffsets([]);
    console.log('[WorkflowConsumer] Committed offsets');
  }
}
