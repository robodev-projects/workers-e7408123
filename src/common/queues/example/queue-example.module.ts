import { Module } from '@nestjs/common';

import { QueueModule } from '~common/queues';

import { QueueExampleController } from './queue-example.controller';
import { QueueExampleQueueProcessor } from './queue-example.queue-processor';
import { QueueExampleService } from './queue-example.service';

@Module({
  imports: [QueueModule, QueueModule.forRoot()],
  controllers: [QueueExampleController],
  providers: [QueueExampleService, QueueExampleQueueProcessor],
  exports: [],
})
export class QueueExampleModule {}
