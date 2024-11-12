import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';
import { deferComposableModule } from '~common/utils/nestjs';

import { QueueProcessorModule } from './processor';
import { QueueConfig } from './queue.config';
import { QueueService } from './queue.service';

@Module({})
export class QueueModule {
  static forRoot = deferComposableModule({
    module: QueueModule,
    imports: [QueueProcessorModule],
    providers: [getConfigFactory(QueueConfig), QueueService],
    exports: [QueueService],
  });
}
