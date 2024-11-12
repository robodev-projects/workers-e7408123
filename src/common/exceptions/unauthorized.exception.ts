import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class UnauthorizedException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Unauthorized',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.UNAUTHORIZED }
        : { code: 'unauthorized', httpStatus: HttpStatus.UNAUTHORIZED, ...input },
    );
  }
}
