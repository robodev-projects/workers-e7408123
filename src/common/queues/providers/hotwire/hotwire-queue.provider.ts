import { Injectable, type OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';

import { LoggerService } from '~common/logger';
import { makeUUID } from '~common/utils/short-uuid';

import { QueueExecutorService } from '../../processor';
import { QueueProvider } from '../../queue-provider.abstract';
import type { Job, JobPayload } from '../../queue.types';

interface HotwireQueueJob<T> {
  jobId: string | number;
  queue: string;
  timeout?: number;
  payload: JobPayload<T>;
  status?: 'draft' | 'queued' | 'started' | 'completed' | 'failed';
  result?: any;
  error?: any;
}

@Injectable()
export class HotwireQueueProvider implements QueueProvider, OnApplicationShutdown, OnApplicationBootstrap {
  constructor(
    private readonly logger: LoggerService,
    private readonly queueExecutor: QueueExecutorService,
  ) {}

  private jobs: Record<string, HotwireQueueJob<any>> = {};
  private queue: HotwireQueueJob<any>[] = [];

  public async send<T extends object>(job: Job<T>): Promise<Job<T>> {
    const jobId = job.options?.id ?? makeUUID();

    await this._enqueueJob({
      jobId,
      timeout: job.options?.timeout || job.processorSettings?.timeout,
      queue: job.processorSettings!.queue,
      payload: {
        name: job.name,
        data: job.data,
      },
    });

    job.id = jobId;
    job.status = 'queued';

    return job;
  }

  private _running = false;
  private _promises: Record<string, { promise: Promise<unknown>; resolve: (value: unknown) => void }[]> = {};

  /**
   * Wait for a job to be done
   *  - `${name}:done` - wait for a specific job to be done
   *  - `${jobID}:done` - wait for a specific job to be done
   *  - `${queue}:done` - wait for all jobs in a queue to be done
   *  - `done` - wait on all jobs to be done
   */
  public async waitOnEvent(event: string): Promise<void> {
    if (!(event in this._promises)) {
      this._promises[event] = [];
    }

    const promise = {
      promise: Promise.resolve(),
    } as { promise: Promise<unknown>; resolve: (value: unknown) => void };
    new Promise((resolve) => {
      promise.resolve = resolve;
    });
    this._promises[event].push(promise);

    await promise.promise;
  }

  public callEvent(event: string) {
    if (event in this._promises) {
      this._promises[event].forEach((p) => p.resolve(true));
      delete this._promises[event];
    }
  }

  private _stop = false;

  onApplicationBootstrap(): any {
    this.logger.debug(`Started hotwire in-memory queue provider`);
  }

  onApplicationShutdown(): any {
    // stop worker when all running jobs are done
    this._stop = true;
  }

  private async _processQueue() {
    if (this._running) {
      return;
    }

    this._running = true;

    while (this.queue.length > 0) {
      if (this._stop) {
        break;
      }

      const internalJob = this.queue.shift();
      if (!internalJob) {
        break;
      }

      try {
        internalJob.status = 'started';
        const job = await this.queueExecutor.execute({
          name: internalJob.payload.name,
          data: internalJob.payload.data,
          id: internalJob.jobId,
          context: {
            timeout: internalJob.timeout,
          },
        } satisfies Job<any>);
        internalJob.status = job.status;
        internalJob.result = job.result;
      } catch (error) {
        this.logger.error(`Error processing job ${internalJob.jobId}.`, error);
        internalJob.status = 'failed';
        internalJob.error = error;
      }

      this.callEvent(`${internalJob.jobId}:done`);

      if (!this.queue.find((t) => t.queue === internalJob.queue)) {
        this.callEvent(`${internalJob.queue}:done`);
      }

      this.callEvent('done');

      this._running = false;
    }
  }

  private async _enqueueJob<T>(job: HotwireQueueJob<T>) {
    this.jobs[job.jobId] = job;
    this.queue.push(job);

    if (!this._running) {
      setImmediate(() => {
        this._processQueue();
      });
    }
  }
}
