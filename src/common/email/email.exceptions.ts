import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class EmailSendError extends BaseException {
  public details: any;

  constructor(message?: string, input?: IBaseException & { details: any }) {
    super(message ?? 'Email Send Error', {
      code: 'email-send-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });

    this.details = input?.details;
  }
}

export class EmailProviderSendError extends EmailSendError {
  constructor(message?: string, input?: IBaseException & { details: any }) {
    super(message ?? 'Email Provider Send Error', {
      code: 'email-provider-send-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
      details: input?.details,
    });
  }
}

export class EmailPreprocessorError extends EmailSendError {
  constructor(message?: string, input?: IBaseException & { details: any }) {
    super(message ?? 'Email Preprocessor Error', {
      code: 'email-preprocessor-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
      details: input?.details,
    });
  }
}
