import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';
import { plainToValidatedInstance } from '~common/validate';

import { QueueProcessorLoader } from './processor';
import { QueueProvider } from './queue-provider.abstract';
import { QueueConfig } from './queue.config';
import { QueueJobRegistrationError } from './queue.exceptions';
import { Job, JobOptions } from './queue.types';

@Injectable()
export class QueueService {
  constructor(
    private readonly logger: LoggerService,
    private readonly queueConfig: QueueConfig,
    private readonly loader: QueueProcessorLoader,
    private readonly queueProvider: QueueProvider,
  ) {}

  /**
   * Enqueue a job
   *  the job will be processed asynchronously in a worker that might be
   *  running in a different process or server. Input and output should
   *  be short, JSON serializable and not sensitive.
   *
   * @param name - processor name
   * @param data - job data
   * @param options - extra options
   * @param options.options - job options
   * @param options.providerOptions - provider options
   * @return {Promise<any>} - response payload
   */
  public async enqueue<T extends object>(
    name: string,
    data: T,
    options?: {
      options?: JobOptions;
      providerOptions?: Record<string, any>;
    },
  ): Promise<Job<T>> {
    const debug = this.queueConfig.debug;

    let job: Job<T> = {
      name: name,
      status: 'draft',
      options: options?.options ?? {},
      providerOptions: options?.providerOptions ?? {},
    };

    if (this.queueProvider.preprocess) {
      // run provider preprocessor, potentially loading the processor
      job = await this.queueProvider.preprocess(job);
    }

    if (!job.processorSettings) {
      // processor not loaded by provider preprocessor
      //  try loading it from the code
      if (!(name in this.loader.processors)) {
        // no processors found
        throw new Error(`Processor '${name}' not found`);
      }
      const { processorSettings } = this.loader.processors[name];
      job.processorSettings = processorSettings;
    }

    job.data = (
      job.processorSettings?.validate ? plainToValidatedInstance(job.processorSettings.validate, data) : data
    ) as T;

    try {
      job = await this.queueProvider.send<T>(job);

      this.logger.send({
        type: 'queue',
        level: 'log',
        data: debug
          ? { job: { name: job.name, id: job.id, status: job.status, options: job.options, data: job.data } }
          : { job: { name: job.name, id: job.id, status: job.status } },
        message: `Job '${job.name}:${job.id}' enqueued`,
      });

      return job;
    } catch (error) {
      job.status = 'failed';
      const e = new QueueJobRegistrationError(`Processor '${job.name}' job registration failed`, {
        job,
        cause: error,
      });
      this.logger.error(e);
      throw e;
    }
  }
}
