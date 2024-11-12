import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';

@Injectable()
export class QueueExampleService {
  constructor(private readonly logger: LoggerService) {}

  async longRunningJob(waitFor: number): Promise<void> {
    this.logger.debug(`Waiting for ${waitFor}ms`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, waitFor);
    });
  }
}
