import { type ModuleMetadata } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { QueueProcessorModule } from '../../processor/queue-processor.module';
import { QueueProvider } from '../../queue-provider.abstract';
import { QueueConfig } from '../../queue.config';
import { PgBossQueueConfig } from './pg-boss-queue.config';
import { PgBossQueueProvider } from './pg-boss-queue.provider';

export const PgBossQueuePlugin: ModuleMetadata = {
  imports: [QueueProcessorModule],
  providers: [
    getConfigFactory(QueueConfig),
    getConfigFactory(PgBossQueueConfig),
    { provide: QueueProvider, useClass: PgBossQueueProvider },
  ],
  exports: [QueueProvider],
};
