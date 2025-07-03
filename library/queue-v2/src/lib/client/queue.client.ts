import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_PRODUCER_NAME } from '../interface/kafka.constant';
import { IQueueClient } from '../interface/queue.interface';
import { WorkflowMessage } from '../message/message.type';

/** A queue client that uses Kafka for workflow messages */
@Injectable()
export class QueueClient implements IQueueClient {
  private readonly logger = new Logger(QueueClient.name);

  constructor(
    @Inject(KAFKA_PRODUCER_NAME) private readonly kafkaClient: ClientKafka
  ) {}

  async sendMessage(message: WorkflowMessage): Promise<boolean> {
    try {
      await this.kafkaClient.emit(message.topic, {
        key: message.key,
        value: message.payload,
        headers: message.headers,
      });

      this.logger.log(
        `[Queue] Message sent successfully to topic: ${message.topic}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `[Queue] Failed to send message to topic ${message.topic}:`,
        error
      );
      return false;
    }
  }

  async sendWorkflowTrigger(
    payload: any,
    topic = 'workflow.trigger'
  ): Promise<boolean> {
    const message: WorkflowMessage = {
      topic,
      key: payload.workflowId || 'default',
      payload,
      headers: {
        source: 'workflow-engine',
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendMessage(message);
  }

  async sendWorkflowAction(
    payload: any,
    topic = 'workflow.action'
  ): Promise<boolean> {
    const message: WorkflowMessage = {
      topic,
      key: payload.actionId || 'default',
      payload,
      headers: {
        source: 'workflow-engine',
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendMessage(message);
  }

  // For backward compatibility with the interface
  async receiveMessage(): Promise<WorkflowMessage[] | undefined> {
    // This method is typically handled by Kafka consumers
    // Implementation would depend on your specific consumer logic
    this.logger.warn(
      '[Queue] receiveMessage is not implemented for Kafka client. Use consumers instead.'
    );
    return [];
  }

  async deleteMessage(message: WorkflowMessage): Promise<boolean> {
    // Kafka doesn't have message deletion like SQS
    // Messages are committed by consumers
    this.logger.warn(
      '[Queue] deleteMessage is not applicable for Kafka. Messages are committed by consumers.'
    );
    return true;
  }
}
