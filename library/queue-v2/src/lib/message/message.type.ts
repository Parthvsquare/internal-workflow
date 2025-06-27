// import {
//   CUSTOMER_IO_EVENTS,
//   EmailTaggingAgent,
//   EmailTaggingDto,
//   InterestType,
//   LeadLabelEnum,
// } from '@leadsend/storage';

// export enum MessageSource {
//   SCHEDULE = 'schedule',
//   SYSTEM = 'system',
//   DELETION = 'deletion',
//   DELEGATE = 'delegate',
//   USER_SIGN_UP = 'userSignUp',

//   BRAND_CREATED = 'brandCreated',
//   BRAND_UPDATED = 'brandUpdated',

//   DOMAIN_CREATED = 'domainCreated',

//   CAMPAIGN_CREATED = 'campaignCreated',

//   CUSTOMER_IO_EVENT = 'customerIO',

//   NOTIFY_INTERESTED_LEADS = 'notifyInterestedLead',
// }

// abstract class BaseActionData {
//   brandId: string;
// }

// export class DelegateActionData extends BaseActionData {
//   managerId: string;
// }

// export class DeleteActionData {
//   resourceId: string;
// }

// export class BrandCreatedData extends BaseActionData {
//   brandName: string;
// }

// export class BrandUpdatedData extends BaseActionData {
//   updated: Record<string, any>[];
// }

// export class CampaignCreateData extends BaseActionData {
//   campaignId: string;
// }

// export class CustomerIoData {
//   brandId?: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   eventType: CUSTOMER_IO_EVENTS;
//   eventPayload?: object;
// }

// export class InterestedLeadData {
//   leadId: string;
//   label: LeadLabelEnum;
//   interestType: InterestType;
// }

/** Workflow message for Kafka topics */
export interface WorkflowMessage {
  topic: string;
  key: string;
  payload: any;
  headers?: Record<string, string>;
}

/** Legacy action message for backward compatibility */
export interface ActionMessage {
  source: string;
  messageBody: string | undefined;
  receiptHandle?: string;
}

/** Workflow trigger message payload */
export interface WorkflowTriggerPayload {
  workflowId: string;
  triggerId: string;
  triggerName: string;
  eventData: any;
  timestamp: string;
  source: string;
}

/** Workflow action message payload */
export interface WorkflowActionPayload {
  workflowId: string;
  workflowRunId: string;
  actionId: string;
  actionName: string;
  actionData: any;
  stepId: string;
  timestamp: string;
}

/** Database change event from CDC/Debezium */
export interface DatabaseChangeEvent {
  // Generic CDC fields
  operation?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  changedFields?: string[];
  transactionId?: string;
  eventTimestamp?: string;
  metadata?: Record<string, any>;

  // Debezium-specific fields
  op?: 'c' | 'u' | 'd' | 'r'; // create, update, delete, read
  source?: {
    table: string;
    schema: string;
    db: string;
    ts_ms: number;
    [key: string]: any;
  };
  ts_ms?: number; // Event timestamp in milliseconds
}

/** Schedule trigger payload */
export interface ScheduleTriggerPayload {
  workflowId: string;
  scheduleId: string;
  cronExpression: string;
  triggerTime: string;
  timezone?: string;
}

/** Webhook trigger payload */
export interface WebhookTriggerPayload {
  workflowId: string;
  webhookId: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  queryParams?: Record<string, string>;
  timestamp: string;
}

// export type EmailTaggingData = {
//   emailData: EmailTaggingDto[];
//   agentName: EmailTaggingAgent;
// };
