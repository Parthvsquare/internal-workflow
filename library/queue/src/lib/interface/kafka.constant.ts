import { KafkaConfig } from 'kafkajs';

const isProduction = process.env['NODE_ENV'] === 'production';

const MESSAGE_URL = process.env['MESSAGE_BROKER_URL'] ?? '';
const BROKER_URLS = MESSAGE_URL.split(',');
const BROKER_USERNAME = process.env['MESSAGE_BROKER_USERNAME'] ?? undefined;
const BROKER_PASSWORD = process.env['MESSAGE_BROKER_PASSWORD'] ?? undefined;

export const KAFKA_PRODUCER_NAME = 'KAFKA_SERVICE';

export const KAFKA_SERVER_CONFIG = {
  KAFKA_ALLOW_AUTO_TOPIC_CREATION: !isProduction, // false for production
};

const EMAIL_ACCOUNT_IMAP = {
  GROUP_ID: 'fetch-email-imap-consumer',
  FETCH_MAIL: 'fetch.imap',
};

const EMAIL_TAGGING_CONSUMER = {
  GROUP_ID: 'email-tagging-consumer',
  TAG_EMAIL: 'tag.email',
};

const CAMPAIGN_LEADS_CONSUMER = {
  GROUP_ID: 'campaign-leads-consumer',
  NEW_CAMPAIGN_LEADS: 'new.campaign.leads',
};

const CAMPAIGN_LEADS_LOG_CONSUMER = {
  GROUP_ID: 'campaign-leads-logs-consumer',
  CREATE_LEAD_LOG: 'create.lead.log',
};

const QUEUE_CONSUMER = {
  GROUP_ID: 'queue-consumer',
  QUEUE: 'new.queue',
};

const TRACKER_LEADS_CONSUMER = {
  GROUP_ID: 'social-tracker-consumer',
  TRACK_FOR: 'new.track.lead',
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

if (BROKER_USERNAME && BROKER_PASSWORD) {
  KAFKA_CLIENT.sasl = {
    mechanism: 'plain',
    username: BROKER_USERNAME,
    password: BROKER_PASSWORD,
  };
}

export const KAFKA = {
  KAFKA_CLIENT,
  EMAIL_ACCOUNT_IMAP,
  CAMPAIGN_LEADS_CONSUMER,
  CAMPAIGN_LEADS_LOG_CONSUMER,
  QUEUE_CONSUMER,
  TRACKER_LEADS_CONSUMER,
  EMAIL_TAGGING_CONSUMER,
};
