import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { UserInfoResponse } from 'auth0';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

import { AuthnException } from '~common/authn';
import { CoreConfig } from '~common/core';
import { LoggerService } from '~common/logger';

import { AuthnProvider } from '../../authn-provider.abstract';
import { AuthnLoader } from '../../authn.loader';
import { IAuthnProviderIdentity, IAuthnUserData } from '../../authn.types';
import { Auth0AuthnConfig } from './auth0-authn.config';
import { AUTH0_AUTHN_PROVIDER_NAME, Auth0AuthorizationFlowToken } from './auth0-authn.types';

/**
 * Auth0 Authn Provider
 */
@Injectable()
export class Auth0AuthnProvider implements AuthnProvider, OnApplicationBootstrap {
  private readonly jwksClient: JwksClient;
  private readonly endpoint: string;
  constructor(
    private readonly logger: LoggerService,
    private readonly loader: AuthnLoader,
    private readonly config: Auth0AuthnConfig,
    private readonly coreConfig: CoreConfig,
  ) {
    this.endpoint = this.config.endpoint || this.config.issuer;

    this.jwksClient = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${this.endpoint}.well-known/jwks.json`,
    });

    /*
    this.managementApi = new ManagementClient({
      domain: this.config.managementApiDomain,
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    });
     */
  }

  onApplicationBootstrap(): any {
    this.loader.registerProvider(AUTH0_AUTHN_PROVIDER_NAME, this);
  }

  public async userData(auth: IAuthnProviderIdentity): Promise<IAuthnUserData | null> {
    if (!auth.providerData?.token) {
      return null;
    }
    let text;
    let data: UserInfoResponse;
    let response;

    try {
      // call auth0 userinfo endpoint
      response = await fetch(`${this.endpoint}userinfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${auth.providerData.token}`,
        },
      });
      text = await response.text();
      data = JSON.parse(text) as UserInfoResponse;
    } catch (error) {
      this.logger.error(
        'Error fetching user data',
        new AuthnException('Auth0UserDataError', {
          details: { response: text ? text : response?.statusText },
          cause: error,
        }),
      );
      return null;
    }

    return {
      email: data.email,
      name: data.name,
      providerData: {
        // more data!
        [AUTH0_AUTHN_PROVIDER_NAME]: data,
      },
    };
  }

  public async resolveAuthnProviderIdentity(options: {
    headers: Record<string, any>;
  }): Promise<IAuthnProviderIdentity | null> {
    if (!options.headers.authorization) {
      return null;
    }
    const match = options.headers.authorization?.match(/^Bearer (.+)$/);
    if (match) {
      return this.getTokenPayload(match[1]);
    }
    return null;
  }

  private async getTokenPayload(token: string): Promise<IAuthnProviderIdentity | null> {
    let payload;
    try {
      payload = await new Promise<string | jwt.JwtPayload | undefined>((resolve, reject) => {
        jwt.verify(
          token,
          async (header, callback) => {
            try {
              const key = await this.jwksClient.getSigningKey(header.kid);
              const signingKey = key.getPublicKey();
              callback(null, signingKey);
            } catch (err) {
              reject(err);
            }
          },
          {
            issuer: this.config.issuer,
            // ignoreExpiration: this.config.ignoreJwtExpiration,
            audience: this.config.audience,
          },
          (err, decoded) => {
            if (err) {
              reject(err);
            }
            resolve(decoded);
          },
        );
      });
    } catch (error) {
      this.logger.error('Error verifying token', { token: jwt.decode(token) }, error);
      return null;
    }

    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      // opaque token - cant decode
      //  we need to get the user via the management API or url
      this.logger.warn('Auth0 Opaque Token not supported');
      return null;
    }

    if (!payload.sub) {
      this.logger.warn('Auth0 Token missing sub');
      return null;
    }

    return {
      provider: AUTH0_AUTHN_PROVIDER_NAME,
      providerId: payload.sub,
      providerData: {
        token,
        payload,
      },
    };
  }

  public getAuthorizationFlowUrl(): string {
    if (
      !this.config.managementDomain ||
      !this.config.clientId ||
      !this.config.clientSecret ||
      !this.config.audience ||
      !this.config.authorizationFlowRedirectUrl ||
      !this.config.authorizationFlowScope ||
      !this.config.authorizationFlowConnection
    ) {
      throw new Error('Authorization Flow not configured');
    }

    const redirect = this.config.authorizationFlowRedirectUrl.startsWith('/')
      ? this.coreConfig.apiBaseUrl + this.config.authorizationFlowRedirectUrl
      : this.config.authorizationFlowRedirectUrl;

    return [
      `${this.config.managementDomain}/authorize?response_type=code`,
      `client_id=${this.config.clientId}`,
      `redirect_uri=${encodeURIComponent(redirect)}`,
      `audience=${this.config.audience}`,
      `scope=${this.config.authorizationFlowScope}`,
      `connection=${this.config.authorizationFlowConnection}`,
    ].join('&');
  }

  public async getAuthorizationFlowToken(code: string): Promise<Auth0AuthorizationFlowToken> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.authorizationFlowRedirectUrl) {
      throw new Error('Authorization Flow not configured');
    }

    const redirect = this.config.authorizationFlowRedirectUrl.startsWith('/')
      ? this.coreConfig.apiBaseUrl + this.config.authorizationFlowRedirectUrl
      : this.config.authorizationFlowRedirectUrl;

    const response = await fetch(`${this.endpoint}oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: encodeURIComponent(redirect),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as Auth0AuthorizationFlowToken;
  }

  health(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
