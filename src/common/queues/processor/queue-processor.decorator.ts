import { extendArrayMetadata } from '@nestjs/common/utils/extend-metadata.util';

import { ProcessorSettings, QUEUE_PROCESSOR_METADATA } from '../queue.types';

/**
 * Mark method as a queue processor
 */
export function RegisterProcessor(name: string, options?: Partial<ProcessorSettings>): MethodDecorator;
export function RegisterProcessor(options: Partial<ProcessorSettings>): MethodDecorator;
export function RegisterProcessor(
  input1: Partial<ProcessorSettings> | string,
  input2?: Partial<ProcessorSettings>,
): MethodDecorator {
  const input: Partial<ProcessorSettings> =
    typeof input1 === 'string' ? { ...(input2 ? input2 : {}), name: input1 } : input1;

  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    extendArrayMetadata(QUEUE_PROCESSOR_METADATA, [{ queue: 'default', ...input }], descriptor.value);
    return descriptor;
  };
  decoratorFactory.KEY = QUEUE_PROCESSOR_METADATA;
  return decoratorFactory;
}
