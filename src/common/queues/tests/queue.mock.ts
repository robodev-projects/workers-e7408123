import type { ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { mock } from 'node:test';

import { QueueExecutorService } from '../processor/queue-executor.service';
import { QueueProvider } from '../queue-provider.abstract';
import { QueueService } from '../queue.service';
import type { Job } from '../queue.types';

/**
 * Mock all calls to QueueService
 */
export const QueueServiceMock: ValueProvider = {
  provide: QueueService,
  useValue: {
    enqueue: mock.fn((name, data, options) => {
      return {
        name,
        data,
        options: options.options ?? undefined,
        providerOptions: options.providerOptions ?? undefined,
        processorSettings: {
          name,
          queue: 'default',
        },
        status: 'queued',
      } satisfies Job<any>;
    }),
  },
};

/**
 * Mock calls to Queue Providers
 */
export const QueueProviderMock: ValueProvider = {
  provide: QueueProvider,
  useValue: {
    send: mock.fn((a: Job<any>) => {
      return { ...a, id: a.id ?? 'mock-id', status: 'queued' } satisfies Job<any>;
    }),
  },
};

/**
 * Mock calls to Queue Executor
 */
export const QueueExecutorServiceMock: ValueProvider = {
  provide: QueueExecutorService,
  useValue: {
    execute: mock.fn((a: Job<any>) => {
      return { ...a, result: 'mock-result', status: 'completed' } satisfies Job<any>;
    }),
  },
};
