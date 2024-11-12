import { type ModuleMetadata } from '@nestjs/common';

import { QueueProcessorModule } from '../../processor';
import { QueueProvider } from '../../queue-provider.abstract';
import { HotwireQueueProvider } from './hotwire-queue.provider';

/**
 * Hotwire queue module
 *  Directly runs all requests in the same process
 */
export const HotwireQueuePlugin: ModuleMetadata = {
  imports: [QueueProcessorModule],
  providers: [{ provide: QueueProvider, useClass: HotwireQueueProvider }],
  exports: [],
};
