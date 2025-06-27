// Kafka broker configuration
export const KAFKA_BROKERS = process.env['KAFKA_BROKERS'] || 'localhost:9092';
export const KAFKA_USERNAME = process.env['KAFKA_USERNAME'];
export const KAFKA_PASSWORD = process.env['KAFKA_PASSWORD'];
export const KAFKA_SSL_ENABLED = process.env['KAFKA_SSL_ENABLED'] === 'true';

// Workflow topic constants
export const WORKFLOW_TRIGGER_TOPIC =
  process.env['WORKFLOW_TRIGGER_TOPIC'] || 'workflow.trigger';
export const WORKFLOW_ACTION_TOPIC =
  process.env['WORKFLOW_ACTION_TOPIC'] || 'workflow.action';
export const DATABASE_CHANGE_TOPIC =
  process.env['DATABASE_CHANGE_TOPIC'] || 'database.change';

// Consumer group constants
export const WORKFLOW_CONSUMER_GROUP =
  process.env['WORKFLOW_CONSUMER_GROUP'] || 'workflow-engine';
export const DATABASE_CONSUMER_GROUP =
  process.env['DATABASE_CONSUMER_GROUP'] || 'database-change-consumer';

// Producer client ID
export const WORKFLOW_PRODUCER_CLIENT_ID =
  process.env['WORKFLOW_PRODUCER_CLIENT_ID'] || 'workflow-producer';
