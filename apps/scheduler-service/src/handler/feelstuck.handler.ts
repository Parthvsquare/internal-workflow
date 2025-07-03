import { Injectable } from '@nestjs/common';
import { IActionHandler } from './handler.interface';
// import { IActionHandler } from './handler.interface';
// import {
//   CampaignLeadRepository,
//   UPDATE_STUCK_CAMPAIGN_LEAD,
// } from '@leadsend/storage';
// import { logger, METRIC_SERVICE, ServiceMetric } from '@leadsend/logging';

@Injectable()
export class FixStuckScheduledCampaignLeadsHandler implements IActionHandler {
  async handle(message: any): Promise<void | boolean> {
    return true;
  }
}
