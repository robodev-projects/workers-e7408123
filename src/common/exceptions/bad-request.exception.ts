import { HttpStatus } from '@nestjs/common';

import { BaseException, IBaseException } from '~common/exceptions/base.exception';

export class BadRequestException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Not Found',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.BAD_REQUEST }
        : { code: 'bad-request', httpStatus: HttpStatus.BAD_REQUEST, ...input },
    );
  }
}
