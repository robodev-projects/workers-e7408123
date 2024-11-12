import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';

import { MediaProvider } from './media-provider.abstract';

@Injectable()
export class MediaLoader {
  constructor(private readonly logger: LoggerService) {}

  public providers: Record<string, MediaProvider> = {};

  /**
   * Register a media provider by name
   */
  public registerProvider(name: string, provider: MediaProvider): void {
    if (name in this.providers) {
      throw new Error(`Provider ${name} already registered`);
    }
    this.logger.debug(`Registered provider {${name}}`);
    this.providers[name] = provider;
  }
}
