export interface IAuthnProviderIdentity {
  /** Identity provider, eq local, auth0 **/
  provider: string;
  /** Identity id, eq sub for auth0 **/
  providerId: string;
  /** Extra provider data **/
  providerData?: Record<string, any>;
}

/**
 * Resolved identity from the authn provider
 */
export interface IAuthnIdentity extends IAuthnProviderIdentity {
  /** Internal Identity ID */
  id: string;

  disabled: boolean;

  /**
   * The
   */
  type: string;

  /**
   * The user id that this identity is associated with
   */
  userId: string;

  createdAt: Date;
}

export interface IAuthnUserData {
  providerId?: string;
  name?: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  emailVerified?: boolean;
  providerData?: Record<string, Record<string, any>>;
}

export interface IAuthnIdentityCreate {
  id?: string;
  provider: string;
  providerId: string;
  disabled?: boolean;
  type: string;
  userId: string;
}

export interface IAuthnIdentityUpdate {
  disabled?: boolean;
}

export interface IAuthnToken {
  accessToken: string;
  refreshToken?: string;
}

export interface IAuthnSession {
  sessionId: string;

  // unix timestamp
  expiresAt: number;

  // IAuthnIdentityId
  authnId: string;
  userId: string;
  userType: string;

  // userAgent: string;

  // unix timestamp
  createdAt: number;

  payload: Record<string, any>;
}

export interface IAuthnJWTToken extends Record<string, any> {
  // created at
  iat: number;
  // expires at
  exp: number;
  // audience
  aud: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: (IAuthnProviderIdentity | IAuthnIdentity) & {
        // used in logging
        ident: string;
      };
    }
  }
}
