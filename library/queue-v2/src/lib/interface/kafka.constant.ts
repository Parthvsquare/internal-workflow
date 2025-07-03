import { KafkaConfig } from 'kafkajs';

const isProduction = process.env['NODE_ENV'] === 'production';

const MESSAGE_URL = 'localhost:9092';
const BROKER_URLS = MESSAGE_URL.split(',').filter(
  (url) => url.trim().length > 0
);
// Ensure we have at least one broker
if (BROKER_URLS.length === 0) {
  BROKER_URLS.push('localhost:9092');
}

export const KAFKA_PRODUCER_NAME = 'KAFKA_SERVICE';

export const KAFKA_SERVER_CONFIG = {
  KAFKA_ALLOW_AUTO_TOPIC_CREATION: !isProduction, // false for production
};

const KAFKA_CLIENT: KafkaConfig = {
  brokers: BROKER_URLS,
  ssl: false,
  retry: {
    initialRetryTime: 1000, // 1s
    retries: 10, // 10 retries
    maxRetryTime: 30000, // Maximum time between retries
  },
  requestTimeout: 45000, // Match with sessionTimeout
  connectionTimeout: 10000, // Increased for network latency
};

export const KAFKA = {
  KAFKA_CLIENT,
};
