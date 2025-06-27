import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { KAFKA } from '../interface/kafka.constant';
import { DatabaseChangeEvent, WorkflowMessage } from '../message/message.type';

@Injectable()
export class WorkflowConsumer implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private kafka: Kafka;
  private readonly consumerGroup: string = 'workflow-engine';
  private isRunning = false;
  private callbacks: Map<string, (data: any) => Promise<void>> = new Map();
  private pendingSubscriptions: Set<string> = new Set();

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
    this.callbacks.set(topic, callback);
    this.pendingSubscriptions.add(topic);
  }

  async subscribeToWorkflowActions(
    callback: (message: WorkflowMessage) => Promise<void>,
    topic = 'workflow.action'
  ): Promise<void> {
    this.callbacks.set(topic, callback);
    this.pendingSubscriptions.add(topic);
  }

  async subscribeToDatabaseChanges(
    callback: (event: DatabaseChangeEvent) => Promise<void>,
    topic = 'database.change'
  ): Promise<void> {
    this.callbacks.set(topic, callback);
    this.pendingSubscriptions.add(topic);
  }

  async startConsumer(): Promise<void> {
    if (this.isRunning) {
      console.warn('[WorkflowConsumer] Consumer is already running');
      return;
    }

    if (this.pendingSubscriptions.size === 0) {
      console.warn(
        '[WorkflowConsumer] No subscriptions to start consumer with'
      );
      return;
    }

    // Subscribe to all pending topics at once
    for (const topic of this.pendingSubscriptions) {
      console.log(`[WorkflowConsumer] Subscribing to topic: ${topic}`);
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    this.pendingSubscriptions.clear();
    this.isRunning = true;

    console.log('[WorkflowConsumer] Starting consumer...');
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const callback = this.callbacks.get(topic);
          if (!callback) {
            console.warn(
              `[WorkflowConsumer] No callback found for topic: ${topic}`
            );
            return;
          }

          // Handle different message types based on topic
          if (topic === 'workflow.trigger' || topic === 'workflow.action') {
            const workflowMessage: WorkflowMessage = {
              topic,
              key: message.key?.toString() || '',
              payload: JSON.parse(message.value?.toString() || '{}'),
              headers: this.parseHeaders(message.headers),
            };
            await callback(workflowMessage);
          } else {
            // Database change events or other topics
            const changeEvent: DatabaseChangeEvent = JSON.parse(
              message.value?.toString() || '{}'
            );
            await callback(changeEvent);
          }

          console.log(
            `[WorkflowConsumer] Processed message from topic: ${topic}`
          );
        } catch (error) {
          console.error(
            `[WorkflowConsumer] Error processing message from topic ${topic}:`,
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

  async stopConsumer(): Promise<void> {
    if (this.isRunning) {
      await this.consumer.stop();
      this.isRunning = false;
      console.log('[WorkflowConsumer] Consumer stopped');
    }
  }

  async addSubscription(
    topic: string,
    callback: (event: DatabaseChangeEvent | WorkflowMessage) => Promise<void>
  ): Promise<void> {
    this.callbacks.set(topic, callback);
    this.pendingSubscriptions.add(topic);
  }

  getPendingSubscriptions(): string[] {
    return Array.from(this.pendingSubscriptions);
  }

  isConsumerRunning(): boolean {
    return this.isRunning;
  }
}
