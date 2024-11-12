import { extendArrayMetadata } from '@nestjs/common/utils/extend-metadata.util';

import { EMAIL_TEMPLATE_METADATA, IEmailTemplateDecoratorOptions } from '../email.types';

/**
 * Mark method as an email template preprocessor
 */
export function RegisterEmailTemplate(options: IEmailTemplateDecoratorOptions | string): MethodDecorator {
  const input: Partial<IEmailTemplateDecoratorOptions> = typeof options === 'string' ? { template: options } : options;

  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    extendArrayMetadata(EMAIL_TEMPLATE_METADATA, [input], descriptor.value);
    return descriptor;
  };
  decoratorFactory.KEY = EMAIL_TEMPLATE_METADATA;
  return decoratorFactory;
}
