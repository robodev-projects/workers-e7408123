import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';

import { QueueConfig } from '../queue.config';
import { QueueExecutionError } from '../queue.exceptions';
import { Job } from '../queue.types';
import { QueueProcessorLoader } from './queue-processor.loader';

@Injectable()
export class QueueExecutorService {
  constructor(
    private readonly logger: LoggerService,
    private readonly queueConfig: QueueConfig,
    private readonly processorLoader: QueueProcessorLoader,
  ) {}

  /**
   * Execute local job
   *  - called by QueueProviderEvent
   */
  public async execute<T extends object>(job: Job<T>): Promise<Job<T>> {
    if (!(job.name in this.processorLoader.processors)) {
      /**
       * Several reasons for this
       *  - processor not loaded by provider preprocessor ( on this type of instance )
       *  - processor was removed from code after job was enqueued
       */
      throw new Error(`Processor '${job.name}' not found`);
    }

    const debug = this.queueConfig.debug;
    const processor = this.processorLoader.processors[job.name];

    /**
     * processor settings/options are not persisted
     *  we can only get settings here
     */
    job.processorSettings = processor.processorSettings;
    job.status = 'started';

    const startedAt = Date.now();

    this.logger.send({
      type: 'queue',
      level: 'log',
      data: debug
        ? { job: { name: job.name, jobId: job.id, status: job.status, data: job.data, context: job.context } }
        : { job: { name: job.name, jobId: job.id, status: job.status } },
      message: `Job '${job.name}:${job.id}' started`,
    });

    try {
      job.result = await processor.processorFunction(job);
      job.status = 'completed';
      this.logger.send({
        type: 'queue',
        level: 'log',
        data: debug
          ? {
              job: {
                name: job.name,
                jobId: job.id,
                status: job.status,
                duration: Date.now() - startedAt,
                data: job.data,
                context: job.context,
              },
            }
          : { job: { name: job.name, jobId: job.id, status: job.status, duration: Date.now() - startedAt } },
        message: `Job '${job.name}:${job.id}' completed`,
      });
      return job;
    } catch (error) {
      if (error instanceof QueueExecutionError) {
        throw error;
      }
      job.status = 'failed';
      this.logger.send({
        type: 'queue',
        level: 'error',
        error: error as Error,
        data: { job, duration: Date.now() - startedAt },
        message: `Job '${job.name}:${job.id}' failed`,
      });
      throw error;
    }
  }
}
