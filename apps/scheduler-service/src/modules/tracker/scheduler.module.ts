import { Module } from '@nestjs/common';
import { FixStuckScheduledCampaignLeadsHandler } from '../../handler';
import axios from 'axios';
import { InternalWorkflowStorageModule } from '@internal-workflow/storage';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KAFKA } from '@internal-workflow/queue';

const MODULES = [InternalWorkflowStorageModule];

const PROVIDERS = [FixStuckScheduledCampaignLeadsHandler];

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SCHEDULER_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: KAFKA.KAFKA_CLIENT,
        },
      },
    ]),
    ...MODULES,
  ],
  providers: [
    {
      provide: axios,
      useValue: null,
    },
    ...PROVIDERS,
  ],
  exports: [...PROVIDERS],
})
export class SchedulerTrackerModule {}
