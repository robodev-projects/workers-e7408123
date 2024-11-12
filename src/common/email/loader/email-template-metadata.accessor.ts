import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EMAIL_TEMPLATE_METADATA, type IEmailTemplateDecoratorOptions } from '../email.types';

/**
 * Accessor for email template metadata set by the `@RegisterEmailTemplate` decorator
 */
@Injectable()
export class EmailTemplateMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getMetadata(target: Type<unknown>): IEmailTemplateDecoratorOptions[] | undefined {
    // Circumvent a crash that comes from reflect-metadata if it is
    // given a non-object non-function target to reflect upon.
    if (!target || (typeof target !== 'function' && typeof target !== 'object')) {
      return undefined;
    }
    const metadata = this.reflector.get(EMAIL_TEMPLATE_METADATA, target);
    if (!metadata) {
      return undefined;
    }
    return Array.isArray(metadata) ? metadata : [metadata];
  }
}
