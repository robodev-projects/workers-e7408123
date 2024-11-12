import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { getConfigFactory } from '~common/config';

import { QueueConfig } from '../queue.config';
import { QueueExecutorService } from './queue-executor.service';
import { QueueProcessorMetadataAccessor } from './queue-processor-metadata.accessor';
import { QueueProcessorLoader } from './queue-processor.loader';

@Module({
  imports: [DiscoveryModule],
  providers: [
    getConfigFactory(QueueConfig),
    QueueProcessorLoader,
    QueueProcessorMetadataAccessor,
    QueueExecutorService,
  ],
  exports: [QueueProcessorLoader, QueueExecutorService],
})
export class QueueProcessorModule {}
