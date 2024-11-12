import { Injectable } from '@nestjs/common';

import { type Job, RegisterProcessor } from '~common/queues';

import { LongRunningJobDataDto } from './dtos/long-running-job-data.dto';
import { QueueExampleService } from './queue-example.service';

@Injectable()
export class QueueExampleQueueProcessor {
  constructor(private readonly queueExampleService: QueueExampleService) {}

  @RegisterProcessor('long-running-job', { validate: LongRunningJobDataDto })
  async longRunningJobProcessor(job: Job<LongRunningJobDataDto>): Promise<{ message: string }> {
    const waitFor = job.data!.waitFor * 1000;
    await this.queueExampleService.longRunningJob(waitFor);
    return { message: `Ran ${job.id} for ${waitFor}ms` };
  }
}
