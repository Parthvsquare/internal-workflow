import { ActionMessage, WorkflowMessage } from '../message/message.type';

export const QUEUE_CLIENT = 'QueueClient';

export interface IQueueReader {
  receiveMessage(): Promise<WorkflowMessage[] | undefined>;
  deleteMessage(message: WorkflowMessage): Promise<boolean>;
}

export interface IQueueWriter {
  sendMessage(message: WorkflowMessage): Promise<boolean>;
  sendWorkflowTrigger(payload: any, topic?: string): Promise<boolean>;
  sendWorkflowAction(payload: any, topic?: string): Promise<boolean>;
}

export interface IQueueClient extends IQueueReader, IQueueWriter {}

// Legacy interface for backward compatibility
export interface ILegacyQueueClient {
  sendMessage(scheduleData: ActionMessage): Promise<boolean>;
  receiveMessage(): Promise<ActionMessage[] | undefined>;
  deleteMessage(message: ActionMessage): Promise<boolean>;
}
