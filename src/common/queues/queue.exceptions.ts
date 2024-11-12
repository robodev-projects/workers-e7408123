import { HttpStatus } from '@nestjs/common';

import type { IErrorResponse } from '~common/exceptions';
import { BaseException, IBaseException } from '~common/exceptions/base.exception';

import type { Job } from './queue.types';

export class QueueExecutionError extends BaseException {
  constructor(message?: string, input?: IBaseException & { job: Job<any> }) {
    super(message ?? 'Queue Execution Error', {
      code: 'queue-execution-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });

    this.job = input?.job;
  }

  public readonly job: Job<any> | undefined;

  toJSON(): IErrorResponse {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
      job: { name: this.job?.name, jobId: this.job?.id },
    };
  }
}

export class QueueJobRegistrationError extends BaseException {
  constructor(message?: string, input?: IBaseException & { job: Job<any> }) {
    super(message ?? 'Queue Job Registration Error', {
      code: 'queue-job-registration-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });

    this.job = input?.job;
  }

  public readonly job: Job<any> | undefined;

  toJSON(): IErrorResponse {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
      job: { name: this.job?.name, jobId: this.job?.id },
    };
  }
}
