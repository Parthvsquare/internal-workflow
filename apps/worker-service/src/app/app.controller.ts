import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { WorkflowKafkaConsumer } from '../services/workflow-kafka.consumer';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kafkaConsumer: WorkflowKafkaConsumer
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('status')
  getConsumerStatus() {
    return {
      consumer: this.kafkaConsumer.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test/cdc')
  async testCdcEvent(
    @Body()
    body: {
      table: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      before?: any;
      after?: any;
    }
  ) {
    await this.kafkaConsumer.testCdcEvent(
      body.table,
      body.operation,
      body.before,
      body.after
    );
    return { message: 'CDC event processed' };
  }
}
