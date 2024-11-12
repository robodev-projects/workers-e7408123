import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class MediaError extends BaseException {
  public details?: any;
  constructor(message?: string, input?: IBaseException & { details?: any }) {
    super(message ?? 'Media Error', {
      code: 'media-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });
    this.details = input?.details;
  }
}

export class MediaProviderError extends MediaError {
  constructor(message?: string, input?: IBaseException & { details?: any }) {
    super(message ?? 'Media Provider Error', {
      code: 'media-provider-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
      details: input?.details,
    });
  }
}

export class MediaPersistorError extends MediaError {
  constructor(message?: string, input?: IBaseException & { details?: any }) {
    super(message ?? 'Media Persistor Error', {
      code: 'media-persistor-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
      details: input?.details,
    });
  }
}
