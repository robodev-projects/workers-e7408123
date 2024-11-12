import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';

import { AuthnProvider } from './authn-provider.abstract';

@Injectable()
export class AuthnLoader {
  constructor(private readonly logger: LoggerService) {}

  public providers: Record<string, AuthnProvider> = {};

  /**
   * Register an authn provider by name
   */
  public registerProvider(name: string, provider: AuthnProvider): void {
    if (name in this.providers) {
      throw new Error(`Provider ${name} already registered`);
    }
    this.logger.debug(`Registered provider {${name}}`);
    this.providers[name] = provider;
  }
}
