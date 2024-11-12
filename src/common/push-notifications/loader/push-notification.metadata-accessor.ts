import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PUSH_NOTIFICATION_TEMPLATE, IPushNotificationTemplateDecoratorOptions } from '../push-notification.types';

/**
 * Accessor for push-notification template metadata set by the `@RegisterPushNotificationTemplate` decorator
 */
@Injectable()
export class PushNotificationTemplateMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getMetadata(target: Type<unknown>): IPushNotificationTemplateDecoratorOptions[] | undefined {
    // Circumvent a crash that comes from reflect-metadata if it is
    // given a non-object non-function target to reflect upon.
    if (!target || (typeof target !== 'function' && typeof target !== 'object')) {
      return undefined;
    }
    const metadata = this.reflector.get(PUSH_NOTIFICATION_TEMPLATE, target);
    if (!metadata) {
      return undefined;
    }
    return Array.isArray(metadata) ? metadata : [metadata];
  }
}
