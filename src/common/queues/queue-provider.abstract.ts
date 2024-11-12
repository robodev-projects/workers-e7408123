import type { Job } from './queue.types';

export abstract class QueueProvider {
  abstract send<T extends object>(job: Job<T>): Promise<Job<T>>;
  abstract preprocess?<T>(data: Job<T>): Promise<Job<T>>;
}
