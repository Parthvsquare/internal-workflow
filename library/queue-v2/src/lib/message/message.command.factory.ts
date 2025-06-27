import {
  WorkflowMessage,
  WorkflowTriggerPayload,
  WorkflowActionPayload,
} from './message.type';

/** A factory that creates Kafka messages for workflow operations */
export class MessageCommandFactory {
  static createWorkflowTriggerMessage(
    workflowId: string,
    triggerId: string,
    triggerName: string,
    eventData: any,
    topic = 'workflow.trigger'
  ): WorkflowMessage {
    const payload: WorkflowTriggerPayload = {
      workflowId,
      triggerId,
      triggerName,
      eventData,
      timestamp: new Date().toISOString(),
      source: 'workflow-engine',
    };

    return {
      topic,
      key: workflowId,
      payload,
      headers: {
        messageType: 'workflow.trigger',
        workflowId,
        triggerId,
        timestamp: payload.timestamp,
      },
    };
  }

  static createWorkflowActionMessage(
    workflowId: string,
    workflowRunId: string,
    actionId: string,
    actionName: string,
    actionData: any,
    stepId: string,
    topic = 'workflow.action'
  ): WorkflowMessage {
    const payload: WorkflowActionPayload = {
      workflowId,
      workflowRunId,
      actionId,
      actionName,
      actionData,
      stepId,
      timestamp: new Date().toISOString(),
    };

    return {
      topic,
      key: workflowRunId,
      payload,
      headers: {
        messageType: 'workflow.action',
        workflowId,
        workflowRunId,
        actionId,
        timestamp: payload.timestamp,
      },
    };
  }

  static createDatabaseChangeMessage(
    changeEvent: any,
    topic = 'database.change'
  ): WorkflowMessage {
    return {
      topic,
      key:
        changeEvent.table +
        ':' +
        (changeEvent.after?.id || changeEvent.before?.id || 'unknown'),
      payload: changeEvent,
      headers: {
        messageType: 'database.change',
        operation: changeEvent.operation,
        table: changeEvent.table,
        timestamp: changeEvent.eventTimestamp,
      },
    };
  }

  static createGenericMessage(
    topic: string,
    key: string,
    payload: any,
    messageType?: string
  ): WorkflowMessage {
    const headers: Record<string, string> = {
      timestamp: new Date().toISOString(),
    };

    if (messageType) {
      headers.messageType = messageType;
    }

    return {
      topic,
      key,
      payload,
      headers,
    };
  }
}
