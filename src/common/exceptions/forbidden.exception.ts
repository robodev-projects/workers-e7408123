import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class ForbiddenException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Not Found',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.FORBIDDEN }
        : { code: 'forbidden', httpStatus: HttpStatus.FORBIDDEN, ...input },
    );
  }
}
