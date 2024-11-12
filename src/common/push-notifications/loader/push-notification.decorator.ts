import { extendArrayMetadata } from '@nestjs/common/utils/extend-metadata.util';

import { PUSH_NOTIFICATION_TEMPLATE, IPushNotificationTemplateDecoratorOptions } from '../push-notification.types';

/**
 * Mark method as an email template preprocessor
 */
export function RegisterPushNotificationTemplate(options: IPushNotificationTemplateDecoratorOptions): MethodDecorator {
  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    extendArrayMetadata(PUSH_NOTIFICATION_TEMPLATE, [options], descriptor.value);
    return descriptor;
  };
  decoratorFactory.KEY = PUSH_NOTIFICATION_TEMPLATE;
  return decoratorFactory;
}
