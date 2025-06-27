// import { SQSClient, Message } from '@aws-sdk/client-sqs';
// import { QueueConfig } from './queue.config';
// import { ActionMessage, MessageSource } from '../message/message.type';
// import { MessageCommandFactory } from '../message/message.command.factory';
// import { logger } from '@leadsend/logging';
// import { IQueueClient } from '../interface/queue.interface';
// import { Injectable } from '@nestjs/common';
// import {
//   AWS_ACCESS_KEY_ID,
//   AWS_SECRET_ACCESS_KEY,
// } from '../interface/queue.constant';

// /** A queue client that uses AWS SQS */
// @Injectable()
// export class QueueClient implements IQueueClient {
//   private readonly client: SQSClient;

//   constructor(readonly config: QueueConfig) {
//     this.client = new SQSClient({
//       region: this.config.Region,
//       credentials: {
//         accessKeyId: AWS_ACCESS_KEY_ID,
//         secretAccessKey: AWS_SECRET_ACCESS_KEY,
//       },
//     });
//   }

//   async sendMessage(scheduleMessage: ActionMessage): Promise<boolean> {
//     const sendCommand = MessageCommandFactory.getSendMessageCommand(
//       scheduleMessage,
//       this.config
//     );

//     try {
//       await this.client.send(sendCommand);
//       return true;
//     } catch (error) {
//       logger.error(
//         `[Queue] Failed to send message for ${scheduleMessage}`,
//         error
//       );
//       return false;
//     }
//   }

//   async receiveMessage(): Promise<ActionMessage[] | undefined> {
//     const receiveCommand = MessageCommandFactory.getReceiveMessageCommand(
//       this.config
//     );
//     try {
//       const { Messages } = await this.client.send(receiveCommand);

//       console.log('---------------------Messages--------------------------');
//       console.log({ Messages });
//       console.log('---------------------Messages--------------------------');

//       if (!Messages) {
//         return [];
//       }

//       const messages: ActionMessage[] = Messages.map((message: Message) => {
//         const msg = {
//           source: message.MessageAttributes?.['Source']
//             .StringValue as MessageSource,
//           messageBody: message.Body,
//           receiptHandle: message.ReceiptHandle,
//         };
//         return msg;
//       });

//       return messages;
//     } catch (error) {
//       logger.error(`[Queue] Failed to receive message error: ${error}`);
//       return [];
//     }
//   }

//   async deleteMessage(message: ActionMessage): Promise<boolean> {
//     const deleteMessageCommand = MessageCommandFactory.getDeleteMessageCommand(
//       message,
//       this.config
//     );
//     try {
//       await this.client.send(deleteMessageCommand);
//       logger.log(`[Queue] Deleted message ${message.messageBody}`)
//       return true;
//     } catch (error) {
//       logger.error(
//         `[Queue] Failed to delete message with source id: ${message.source}, and body: ${message.messageBody} error: ${error}`
//       );
//       return false;
//     }
//   }
// }
