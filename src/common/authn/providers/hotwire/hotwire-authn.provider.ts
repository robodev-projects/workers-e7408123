import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { IAuthnIdentity, IAuthnProviderIdentity, IAuthnUserData } from '~common/authn';
import { LoggerService } from '~common/logger';

import { AuthnProvider } from '../../authn-provider.abstract';
import { AuthnLoader } from '../../authn.loader';
import { HOTWIRE_AUTHN_PROVIDER_NAME } from './hotwire-authn.types';

/**
 * Hotwire Authn Provider
 *  - Trust the bearer to provide the user data
 *  - ONLY for use in development
 */
@Injectable()
export class HotwireAuthnProvider implements AuthnProvider, OnApplicationBootstrap {
  constructor(
    private readonly logger: LoggerService,
    private readonly loader: AuthnLoader,
  ) {}

  public async resolveAuthnProviderIdentity(options: {
    headers: Record<string, any>;
  }): Promise<IAuthnProviderIdentity | null> {
    if (!options.headers.authorization) {
      return null;
    }
    const match = options.headers.authorization?.match(/^Bearer (.+)$/);

    if (match && match[1].startsWith('{')) {
      try {
        const data = JSON.parse(match[1]);
        return {
          provider: data.provider || HOTWIRE_AUTHN_PROVIDER_NAME,
          providerId: data.providerId || 'hotwire-id',
          providerData: data,
        };
      } catch (e) {
        this.logger.warn(`HotwireAuthnProvider:resolveAuthnProviderIdentity:invalid`, options.headers.authorization);
        return null;
      }
    }
    return null;
  }

  /**
   * Hotwire bypasses authnIdentity and provides the user data directly
   */
  public async resolveAuthnIdentity(auth: IAuthnProviderIdentity): Promise<IAuthnIdentity | null> {
    if (auth.providerData?.userId && auth.providerData?.type) {
      return {
        ...auth,
        userId: auth.providerData.userId,
        type: auth.providerData.type,
        createdAt: auth.providerData.createdAt ? new Date(auth.providerData.createdAt) : new Date(),
        id: auth.providerData.id || '00000000-0000-0000-0000-000000000000',
        disabled: auth.providerData.disabled || false,
      };
    }
    return null;
  }

  public async userData(auth: IAuthnProviderIdentity): Promise<IAuthnUserData | null> {
    if (!auth.providerData) {
      return null;
    }
    return auth.providerData;
  }

  onApplicationBootstrap(): any {
    this.loader.registerProvider(HOTWIRE_AUTHN_PROVIDER_NAME, this);
  }

  health(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
