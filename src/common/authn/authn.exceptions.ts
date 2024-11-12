import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class AuthnException extends BaseException {
  public details: any;

  constructor(message?: string, input?: IBaseException & { details?: any }) {
    super(message ?? 'Authn Exception', {
      code: 'authn-exception',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });

    this.details = input?.details;
  }
}
