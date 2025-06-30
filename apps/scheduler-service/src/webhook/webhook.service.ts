import { Injectable, Logger } from '@nestjs/common';
import { WorkflowEngineService } from '@internal-workflow/workflow-engine';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly workflowEngine: WorkflowEngineService) {}

  async processWebhookTrigger(workflowId: string, payload: any) {
    this.logger.log(`Processing webhook trigger for workflow: ${workflowId}`);

    try {
      const result = await this.workflowEngine.executeWorkflow(workflowId, {
        triggerData: payload,
        triggerType: 'webhook',
        executionMode: 'async',
        triggerEventId: `webhook_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      });

      this.logger.log(
        `Webhook trigger processed successfully: ${JSON.stringify(result)}`
      );

      return {
        success: true,
        message: 'Workflow triggered successfully',
        executionId: result.result?.runId,
        executionTime: result.executionTime,
      };
    } catch (error) {
      this.logger.error(`Error processing webhook trigger: ${error}`);

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
