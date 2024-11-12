import { Controller, Query, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { QueueJobCreateResponseDto, QueueService } from '~common/queues';

import { LongRunningJobDataDto } from './dtos/long-running-job-data.dto';

@ApiTags('Queue Examples')
@Controller('queue-examples')
export class QueueExampleController {
  constructor(private queueService: QueueService) {}

  /**
   * Execute a long-running job
   */
  @Post('/execute/long-running-job')
  async getJobs(@Query() q: LongRunningJobDataDto): Promise<QueueJobCreateResponseDto> {
    const job = await this.queueService.enqueue<LongRunningJobDataDto>('long-running-job', q);
    return QueueJobCreateResponseDto.fromDomain(job);
  }
}
