import { Injectable, type OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import PgBoss, { MonitorStates, Worker } from 'pg-boss';

import { LoggerService } from '~common/logger';

import { QueueExecutorService } from '../../processor';
import { QueueProvider } from '../../queue-provider.abstract';
import { QueueConfig } from '../../queue.config';
import type { Job, JobPayload } from '../../queue.types';
import { PgBossQueueConfig } from './pg-boss-queue.config';

@Injectable()
export class PgBossQueueProvider implements QueueProvider, OnApplicationShutdown, OnApplicationBootstrap {
  private boss?: PgBoss;

  constructor(
    private readonly logger: LoggerService,
    private readonly queueConfig: QueueConfig,
    private readonly pgBossQueueConfig: PgBossQueueConfig,
    private readonly queueExecutor: QueueExecutorService,
  ) {}

  public async send<T extends object>(job: Job<T>): Promise<Job<T>> {
    if (!this.boss) {
      throw new Error(`pg-boss not configured`);
    }

    const options: PgBoss.SendOptions = {};

    if (job.options?.id) options.id = options.id?.toString();
    if (job.options?.timeout) options.expireInSeconds = job.options?.timeout;
    else if (job.processorSettings?.timeout) options.expireInSeconds = job.processorSettings?.timeout;

    const response = await this.boss.send(
      job.processorSettings!.queue,
      {
        name: job.name,
        data: job.data,
      },
      { ...options, ...(job.providerOptions ?? {}) },
    );

    if (!response) {
      throw new Error(`Failed to create job`);
    }

    job.id = response;
    job.status = 'queued';

    return job;
  }

  private async setupQueues() {
    if (!this.boss) {
      throw new Error(`pg-boss not configured`);
    }
    const queues = (await this.boss?.getQueues()) || [];

    const queuesConfig = this.pgBossQueueConfig.queues || [];

    if (queuesConfig.length === 0) {
      queuesConfig.push(
        // default queue
        {
          name: 'default',
          policy: 'standard',
        },
      );
    }

    for (const queueConfig of queuesConfig) {
      const queue = queues.find((queue) => queue.name === queueConfig.name);
      if (!queue) {
        this.logger.debug(`Creating queue: ${queueConfig.name}`, queueConfig);
        await this.boss?.createQueue(queueConfig.name, { ...queueConfig });
      } else {
        // check if queue needs to be updated
        // todo, this could be tricky, check if we can do any sort of versioning
        if (Object.keys(queueConfig).some((key) => (queueConfig as any)[key] !== (queue as any)[key])) {
          this.logger.debug(`Updating queue: ${queueConfig.name}`, { queue, queueConfig });
          await this.boss?.updateQueue(queueConfig.name, { ...queueConfig });
        }
      }
    }
    for (const queue of queues.filter((queue) => !queue.name.startsWith('__'))) {
      if (!this.pgBossQueueConfig.queues.find((queueConfig) => queueConfig.name === queue.name)) {
        // todo, delete the queue ?
        this.logger.debug(`Found defunct queue: ${queue.name}`, { queue });
      }
    }
  }

  private async runWorkers() {
    if (!this.boss) {
      throw new Error(`pg-boss not configured`);
    }

    const workersConfig = this.pgBossQueueConfig.workers || [];
    if (workersConfig.length === 0) {
      workersConfig.push(
        // default worker
        {
          queue: 'default',
          priority: true,
          pollingIntervalSeconds: 2,
          batchSize: 2,
        },
      );
    }

    /**
     * Set up workers for each queue as per their configuration
     *  - global concurrency can not be set with workers, set queue policy instead
     *  - if a worker throws, it will be retried
     */
    for (const workerConfig of workersConfig) {
      const { queue, ...config } = workerConfig;
      this.logger.debug(`Starting queue worker: ${queue}`, config);
      await this.boss.work(queue, config, async ([pbJob]) => {
        // data is always a JobPayload
        const data = pbJob.data as JobPayload<any>;
        const job: Job<any> = {
          id: pbJob.id,
          name: data.name,
          data: data.data,
          context: {
            timeout: pbJob.expireInSeconds
              ? typeof pbJob.expireInSeconds === 'number'
                ? pbJob.expireInSeconds
                : parseFloat(pbJob.expireInSeconds)
              : undefined,
          },
          providerConfig: workerConfig,
          providerContext: pbJob, // PgBoss.Job
        };

        // an unhandled error will cause the job to be retried as per retry config

        const response = await this.queueExecutor.execute(job);
        return { result: response.result, status: response.status };
      });
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.pgBossQueueConfig.url) {
      this.logger.debug(`pg-boss not configured`);
      return;
    }

    /**
     * @see https://timgit.github.io/pg-boss/#/./api/constructor
     */
    const config: PgBoss.ConstructorOptions = {
      connectionString: this.pgBossQueueConfig.url,

      // The schema to create the tables in
      schema: this.pgBossQueueConfig.schema,

      // Maximum number of connections that will be shared by all operations in this instance
      max: this.pgBossQueueConfig.maxConnections,

      // Application name
      // application_name: 'pg-boss',

      // Listen to scheduled jobs
      schedule: this.pgBossQueueConfig.schedule,

      // Run migrations on start
      migrate: this.pgBossQueueConfig.migrate,
    };

    if (this.pgBossQueueConfig.deleteAfterSeconds) {
      // Automatically delete completed jobs after a certain number of seconds
      config.maintenanceIntervalSeconds = this.pgBossQueueConfig.deleteAfterSeconds;
    }

    if (this.pgBossQueueConfig.maintenanceIntervalSeconds) {
      // How often maintenance operations are run against the job and archive tables.
      config.maintenanceIntervalSeconds = this.pgBossQueueConfig.maintenanceIntervalSeconds;
    }

    this.boss = new PgBoss(config);

    /**
     * The error event could be raised during internal processing, such as scheduling and maintenance.
     * Adding a listener to the error event is strongly encouraged because of the default behavior of Node.
     */
    this.boss.on('error', (error: Error) => this.logger.error(error));

    if (this.queueConfig.debug) {
      /**
       * Emitted after stop() once all workers have completed their work and maintenance has been shut down.
       */
      this.boss.on('stopped', () => this.logger.log(`pg-boss stopped`));

      this.boss.on('maintenance', () => this.logger.verbose(`pg-boss 'maintenance' event captured.`));

      /**
       * Emitted at most once every 2 seconds when workers are receiving jobs.
       * The payload is an array that represents each worker in this instance of pg-boss.
       * todo add to config
       */
      this.boss.on('wip', (data: Worker[]) =>
        this.logger.send({
          level: 'verbose',
          data,
          message: `pg-boss 'wip' event`,
        }),
      );

      /**
       * The monitor-states event is conditionally raised based on the monitorStateInterval configuration setting and only emitted from start().
       * If passed during instance creation, it will provide a count of jobs in each state per interval.
       * This could be useful for logging or even determining if the job system is handling its load.
       */
      this.boss.on('monitor-states', (monitorStates: MonitorStates) =>
        this.logger.send({
          message: `pg-boss 'monitor-states' event`,
          level: 'verbose',
          data: monitorStates,
        }),
      );
    }

    /**
     * Start the pg-boss instance.
     *  - run migrations
     */
    await this.boss.start();

    if (this.pgBossQueueConfig.setupQueues) {
      await this.setupQueues();
    }

    if (this.pgBossQueueConfig.runWorkers) {
      await this.runWorkers();
    }

    this.logger.debug(`Started pg-boss ( schema version: ${await this.boss.schemaVersion()} )`);
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    if (this.boss) {
      try {
        this.logger.debug(`Stopping pg-boss (${signal})`);
        /**
         * Gracefully stop all workers and maintenance operations
         */
        await this.boss?.stop({
          /**
           * Wait for jobs to complete
           * todo listen to signal
           */
          graceful: this.pgBossQueueConfig.stopTimeout > 0,

          // Maximum time to wait for jobs to complete
          timeout: this.pgBossQueueConfig.stopTimeout,

          // Resolve only after all is cleaned up
          wait: true,

          // Close the database connection
          close: true,
        });
      } catch (error) {
        this.logger.error(`Error stopping pg-boss`, error);
        throw error;
      }
    }
  }
}
