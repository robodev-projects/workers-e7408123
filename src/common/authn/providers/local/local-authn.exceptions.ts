import { HttpStatus } from '@nestjs/common';

import { IBaseException } from '~common/exceptions/base.exception';

import { AuthnException } from '../../authn.exceptions';

export class LocalAuthnException extends AuthnException {
  public details: any;

  constructor(message?: string, input?: IBaseException & { details?: any }) {
    super(message ?? 'Local Authn Exception', {
      code: 'local-authn-exception',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      ...input,
    });

    this.details = input?.details;
  }
}
