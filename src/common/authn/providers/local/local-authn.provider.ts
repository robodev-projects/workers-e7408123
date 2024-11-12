import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { LoggerService } from '~common/logger';

import { AuthnProvider } from '../../authn-provider.abstract';
import { AuthnLoader } from '../../authn.loader';
import { IAuthnProviderIdentity } from '../../authn.types';
import { LocalAuthnService } from './local-authn.service';
import { LOCAL_AUTHN_PROVIDER_NAME } from './local-authn.types';

@Injectable()
export class LocalAuthnProvider implements AuthnProvider, OnApplicationBootstrap {
  constructor(
    private readonly localAuthnService: LocalAuthnService,
    private readonly loader: AuthnLoader,
    private readonly logger: LoggerService,
  ) {}

  onApplicationBootstrap(): any {
    this.loader.registerProvider(LOCAL_AUTHN_PROVIDER_NAME, this);
  }

  health(): Promise<void> {
    return Promise.resolve(undefined);
  }

  public async resolveAuthnProviderIdentity(options: {
    headers: Record<string, any>;
  }): Promise<IAuthnProviderIdentity | null> {
    if (!options.headers.authorization) {
      return null;
    }
    const match = options.headers.authorization?.match(/^Bearer (local:(.+))$/);

    if (match) {
      try {
        const token = await this.localAuthnService.verifyToken(match[1]);
        if (token) {
          return {
            provider: LOCAL_AUTHN_PROVIDER_NAME,
            providerId: token.uid,
            providerData: { token },
          };
        }
      } catch (e: any) {
        this.logger.send({ error: e, message: e.message });
        return null;
      }
    }
    return null;
  }
}
