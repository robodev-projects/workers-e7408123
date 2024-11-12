import { ExecutionContext, Injectable } from '@nestjs/common';

import { AuthnIdentityPersistor } from './authn-identity-persistor.abstract';
import { AuthnLoader } from './authn.loader';
import { IAuthnIdentity, type IAuthnIdentityCreate, IAuthnProviderIdentity, IAuthnUserData } from './authn.types';

@Injectable()
export class AuthnService {
  constructor(
    private readonly authnIdentityPersistor: AuthnIdentityPersistor,
    private readonly loader: AuthnLoader,
  ) {}

  public async findIdentity(
    where: { id: string } | { provider: string; providerId: string },
  ): Promise<IAuthnIdentity | null> {
    return this.authnIdentityPersistor.findIdentity(where);
  }

  public async createIdentity(data: IAuthnIdentityCreate): Promise<IAuthnIdentity> {
    return this.authnIdentityPersistor.createIdentity(data);
  }

  public async updateIdentity(
    where: { id: string } | { provider: string; providerId: string },
    data: IAuthnIdentity,
  ): Promise<IAuthnIdentity> {
    return this.authnIdentityPersistor.updateIdentity(where, data);
  }

  public async deleteIdentity(where: {
    id?: string | string[];
    provider?: string | string[];
    providerId?: string | string[];
    type?: string | string[];
    userId?: string | string[];
  }): Promise<void> {
    return this.authnIdentityPersistor.deleteIdentity(where);
  }

  /**
   * Get user data from the provider
   */
  public async providerUserData(auth: IAuthnProviderIdentity): Promise<IAuthnUserData | null> {
    if (!auth.provider || !(auth.provider in this.loader.providers)) {
      throw new Error(`Provider not found: '${auth.provider}'`);
    }
    const provider = this.loader.providers[auth.provider];
    if (provider.userData) {
      return await provider.userData(auth);
    }
    return null;
  }

  /**
   * Get the authnIdentity from the request context and apply it to the request
   *  - parse the Authorization header "Bearer" with each provider
   */
  public async applyAuthnProviderIdentity(
    context: ExecutionContext,
    options?: {
      provider?: string | string[];
    },
  ): Promise<IAuthnProviderIdentity | null> {
    const request = context.switchToHttp().getRequest();

    for (const [providerName, provider] of Object.entries(this.loader.providers)) {
      if (!provider.resolveAuthnProviderIdentity) {
        continue;
      }
      if (options?.provider) {
        if (Array.isArray(options.provider)) {
          if (!options.provider.includes(providerName)) {
            continue;
          }
        } else if (providerName !== options.provider) {
          continue;
        }
      }
      const authnIdentity = await provider.resolveAuthnProviderIdentity({
        headers: request.headers,
      });
      if (authnIdentity) {
        // trust the first matching provider
        request.auth = {
          ...authnIdentity,
          // logging
          ident: `${providerName}:${authnIdentity.providerId}`,
        };
        return authnIdentity;
      }
    }
    return null;
  }

  /**
   * Check if the context has a valid authnIdentity - i.e. try to resolve the userId from the request
   *  - based on the provider, the userId could have been passed in, or looked up in the database or remote host
   *  - by default, we look up the userId in the database using the provider and providerId
   */
  public async applyAuthnIdentity(context: ExecutionContext): Promise<IAuthnIdentity | null> {
    const request = context.switchToHttp().getRequest();
    const auth: IAuthnProviderIdentity = request.auth;
    if (!auth || !auth.provider || !auth.providerId) {
      return null;
    }
    const provider = this.loader.providers[auth.provider];
    if (!provider) {
      // mismatch of providers
      throw new Error(`Provider not found: ${auth.provider}`);
    }

    let authnIdentity;

    if (provider.resolveAuthnIdentity) {
      authnIdentity = await provider.resolveAuthnIdentity(auth);
    }

    if (!authnIdentity) {
      // check database
      authnIdentity = await this.authnIdentityPersistor.findIdentity({
        provider: auth.provider,
        providerId: auth.providerId,
      });
    }

    if (authnIdentity) {
      request.auth = {
        ...authnIdentity,
        // logging
        ident: `${authnIdentity.type}:${authnIdentity.userId}`,
      };
      return authnIdentity;
    }
    return null;
  }
}
