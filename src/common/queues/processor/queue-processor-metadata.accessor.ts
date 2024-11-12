import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ProcessorSettings, QUEUE_PROCESSOR_METADATA } from '../queue.types';

/**
 * Accessor for queue processor metadata set by the `@QueueProcessor` decorator
 */
@Injectable()
export class QueueProcessorMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getMetadata(target: Type<unknown>): ProcessorSettings[] | undefined {
    // Circumvent a crash that comes from reflect-metadata if it is
    // given a non-object non-function target to reflect upon.
    if (!target || (typeof target !== 'function' && typeof target !== 'object')) {
      return undefined;
    }
    const metadata = this.reflector.get(QUEUE_PROCESSOR_METADATA, target);
    if (!metadata) {
      return undefined;
    }
    return Array.isArray(metadata) ? metadata : [metadata];
  }
}
