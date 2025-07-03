import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { WorkflowProcessorService } from '../services/workflow.processor.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workflowProcessor: WorkflowProcessorService
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('status')
  getConsumerStatus() {
    return {
      consumer: { running: true, service: 'WorkflowProcessorService' },
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
    // Create a test database change event
    const testEvent = {
      operation: body.operation,
      table: body.table,
      before: body.before,
      after: body.after,
      eventTimestamp: new Date().toISOString(),
      metadata: { source: 'test' },
    };

    // Process the test event (this will call the private method via reflection)
    // For now, we'll just return a success message
    return {
      message: 'CDC event would be processed',
      event: testEvent,
    };
  }
}
