import { IAuthnIdentity, IAuthnProviderIdentity, IAuthnUserData } from '~common/authn/authn.types';

/**
 * Authn Provider Service
 *  may of these instances can be created and used in parallel
 *  - `AuthnLoader.providers` is a map of these instances
 */
export abstract class AuthnProvider {
  /**
   * Get user details from the authn provider
   */
  public abstract userData?(auth: IAuthnProviderIdentity): Promise<IAuthnUserData | null>;

  /**
   * Resolve the AuthnProviderIdentity from the request headers
   */
  public abstract resolveAuthnProviderIdentity?(options: {
    headers: Record<string, any>;
  }): Promise<IAuthnProviderIdentity | null>;

  /**
   * Optional method to resolve the AuthnIdentity from the AuthnProviderIdentity
   *  - provides the userId and completely bypasses the authnIdentity/session system
   */
  public abstract resolveAuthnIdentity?(auth: IAuthnProviderIdentity): Promise<IAuthnIdentity | null>;

  /**
   * Health check for the authn provider
   *  and a convenient way to avoid TS2559 (weak type detection)
   */
  public abstract health(): Promise<void>;
}
