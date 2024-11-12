import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class PushNotificationError extends BaseException {
  public details: any;

  constructor(message?: string, input?: IBaseException & { details: any }) {
    super(message ?? 'Push Notification Error', {
      code: 'push-notification-error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });

    this.details = input?.details;
  }
}
