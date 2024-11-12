import type { IAuthnIdentity, IAuthnIdentityCreate, IAuthnIdentityUpdate } from './authn.types';

/**
 * Store identities
 *  this is a link between user modules and providers, it needs to be persisted
 */
export abstract class AuthnIdentityPersistor {
  public abstract findIdentity(
    where: { id: string } | { provider: string; providerId: string },
  ): Promise<IAuthnIdentity | null>;

  public abstract createIdentity(data: IAuthnIdentityCreate): Promise<IAuthnIdentity>;

  public abstract updateIdentity(
    where: { id: string } | { provider: string; providerId: string },
    data: IAuthnIdentityUpdate,
  ): Promise<IAuthnIdentity>;

  public abstract deleteIdentity(where: {
    id?: string | string[];
    provider?: string | string[];
    providerId?: string | string[];
    type?: string | string[];
    userId?: string | string[];
  }): Promise<void>;
}
