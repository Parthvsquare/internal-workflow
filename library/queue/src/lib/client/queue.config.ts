import { Injectable } from '@nestjs/common';

/** Configuration class for workflow queue operations using Kafka */
@Injectable()
export class QueueConfig {
  public readonly kafkaBrokers: string[];
  public readonly workflowTriggerTopic: string;
  public readonly workflowActionTopic: string;
  public readonly databaseChangeTopic: string;
  public readonly consumerGroupId: string;
  public readonly producerClientId: string;

  constructor() {
    // Parse Kafka brokers from environment
    const brokersString = process.env['KAFKA_BROKERS'] || 'localhost:9092';
    this.kafkaBrokers = brokersString.split(',').map((broker) => broker.trim());

    // Workflow-specific topics
    this.workflowTriggerTopic =
      process.env['WORKFLOW_TRIGGER_TOPIC'] || 'workflow.trigger';
    this.workflowActionTopic =
      process.env['WORKFLOW_ACTION_TOPIC'] || 'workflow.action';
    this.databaseChangeTopic =
      process.env['DATABASE_CHANGE_TOPIC'] || 'database.change';

    // Consumer and producer configuration
    this.consumerGroupId =
      process.env['KAFKA_CONSUMER_GROUP'] || 'workflow-engine';
    this.producerClientId =
      process.env['KAFKA_PRODUCER_CLIENT_ID'] || 'workflow-producer';
  }

  getTopicForMessageType(messageType: string): string {
    switch (messageType) {
      case 'workflow.trigger':
        return this.workflowTriggerTopic;
      case 'workflow.action':
        return this.workflowActionTopic;
      case 'database.change':
        return this.databaseChangeTopic;
      default:
        return messageType; // Use the messageType as topic name
    }
  }
}
