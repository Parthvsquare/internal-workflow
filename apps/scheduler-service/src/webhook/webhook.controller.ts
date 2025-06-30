import { Controller, Post, Body, Param, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post(':workflowId')
  @ApiOperation({ summary: 'Trigger workflow via webhook' })
  @ApiParam({ name: 'workflowId', description: 'Workflow ID to trigger' })
  @ApiBody({ description: 'Webhook payload data' })
  async triggerWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() payload: any
  ) {
    this.logger.log(`Webhook trigger received for workflow: ${workflowId}`);

    return this.webhookService.processWebhookTrigger(workflowId, payload);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for webhook service' })
  async healthCheck() {
    return { status: 'ok', service: 'webhook-scheduler' };
  }
}
