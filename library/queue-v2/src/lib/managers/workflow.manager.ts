import { Inject, Injectable } from '@nestjs/common';
import { QueueClient } from '../client/queue.client';
import { KAFKA_PRODUCER_NAME } from '../interface/kafka.constant';
import { MessageCommandFactory } from '../message/message.command.factory';
import { DatabaseChangeEvent } from '../message/message.type';

@Injectable()
export class WorkflowManager {
  constructor(
    @Inject(KAFKA_PRODUCER_NAME)
    private readonly queueClient: QueueClient
  ) {}

  async triggerWorkflow(
    workflowId: string,
    triggerId: string,
    triggerName: string,
    eventData: any,
    source = 'workflow-engine'
  ): Promise<boolean> {
    const message = MessageCommandFactory.createWorkflowTriggerMessage(
      workflowId,
      triggerId,
      triggerName,
      eventData
    );

    return this.queueClient.sendMessage(message);
  }

  async executeWorkflowAction(
    workflowId: string,
    workflowRunId: string,
    actionId: string,
    actionName: string,
    actionData: any,
    stepId: string
  ): Promise<boolean> {
    const message = MessageCommandFactory.createWorkflowActionMessage(
      workflowId,
      workflowRunId,
      actionId,
      actionName,
      actionData,
      stepId
    );

    return this.queueClient.sendMessage(message);
  }

  async sendDatabaseChangeEvent(
    changeEvent: DatabaseChangeEvent,
    topic = 'database.change'
  ): Promise<boolean> {
    const message = MessageCommandFactory.createDatabaseChangeMessage(
      changeEvent,
      topic
    );

    return this.queueClient.sendMessage(message);
  }

  async sendScheduledTrigger(
    workflowId: string,
    scheduleId: string,
    cronExpression: string,
    triggerTime: string,
    timezone?: string
  ): Promise<boolean> {
    const eventData = {
      scheduleId,
      cronExpression,
      triggerTime,
      timezone,
    };

    return this.triggerWorkflow(
      workflowId,
      scheduleId,
      'scheduled_trigger',
      eventData,
      'scheduler-service'
    );
  }

  async sendWebhookTrigger(
    workflowId: string,
    webhookId: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    queryParams?: Record<string, string>
  ): Promise<boolean> {
    const eventData = {
      webhookId,
      method,
      headers,
      body,
      queryParams,
    };

    return this.triggerWorkflow(
      workflowId,
      webhookId,
      'webhook_trigger',
      eventData,
      'api-service'
    );
  }
}
