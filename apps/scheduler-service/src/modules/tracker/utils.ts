import { CronExpression } from '@nestjs/schedule';

export const SchedulerCronExpression = {
  EVERY_2_MINUTE: '*/2 * * * *',
  EVERY_3_MINUTE: '*/3 * * * *',
  EVERY_15_MINUTE: '0 */15 * * * *',
  ...CronExpression,
};
