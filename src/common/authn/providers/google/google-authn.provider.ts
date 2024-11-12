import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { Credentials, OAuth2Client, TokenInfo, TokenPayload } from 'google-auth-library';

import { CoreConfig } from '~common/core';
import { LoggerService } from '~common/logger';

import { AuthnProvider } from '../../authn-provider.abstract';
import { AuthnException } from '../../authn.exceptions';
import { AuthnLoader } from '../../authn.loader';
import { IAuthnProviderIdentity, IAuthnUserData } from '../../authn.types';
import { GoogleAuthnConfig } from './google-authn.config';
import { GOOGLE_AUTHN_PROVIDER_NAME, IGoogleAuthorizationFlowTokenResponse } from './google-authn.types';

@Injectable()
export class GoogleAuthnProvider implements AuthnProvider, OnApplicationBootstrap {
  private readonly oauthClient: OAuth2Client;
  private readonly authorizationFlowRedirectUrl: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly loader: AuthnLoader,
    private readonly config: GoogleAuthnConfig,
    private readonly coreConfig: CoreConfig,
  ) {
    this.authorizationFlowRedirectUrl = this.config.authorizationFlowRedirectUrl.startsWith('/')
      ? this.coreConfig.apiBaseUrl + this.config.authorizationFlowRedirectUrl
      : this.config.authorizationFlowRedirectUrl;

    this.oauthClient = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.authorizationFlowRedirectUrl,
    );
  }

  /**
   *  Validate Id Token passed in the header
   */
  public async resolveAuthnProviderIdentity(options: {
    headers: Record<string, any>;
  }): Promise<IAuthnProviderIdentity | null> {
    if (!options.headers.authorization) {
      return null;
    }
    const match = options.headers.authorization?.match(/^Bearer (.+)$/);
    if (match) {
      try {
        // extractIdTokenPayload for more info but larger payload
        //  we could enforce IdToken for just registration and AccessToken for everything else
        const data = await this.extractAccessTokenPayload(match[1]);
        if (!data) {
          return null;
        }
        return {
          providerId: data.sub!,
          provider: GOOGLE_AUTHN_PROVIDER_NAME,
          providerData: { token: data },
        };
      } catch (cause) {
        this.logger.error('Could not validate token', cause);
        return null;
      }
    }
    return null;
  }

  /**
   *  extract data from token
   */
  // public async resolveAuthnIdentity?(): Promise<IAuthnIdentity | null>;

  /**
   * Generate the authentication URL
   *  - clients follow this and return the code to the redirect url
   */
  getAuthorizationFlowUrl(): string {
    const { scopes, clientId, oauth2Url } = this.config;

    if (!scopes || !clientId || !oauth2Url) {
      throw new AuthnException('Authorization flow not available');
    }

    const query = [
      ['client_id', clientId],
      ['scope', scopes.join(' ')],
      ['response_type', 'code'],
      ['redirect_uri', this.authorizationFlowRedirectUrl],
    ]
      .map((queryKey) => {
        const key = queryKey[0];
        const val = queryKey[1];

        return `${key}=${encodeURIComponent(val)}`;
      })
      .join('&');

    return `${oauth2Url}?${query}`;
  }

  async handleAuthorizationFlowCallback(code: string): Promise<IGoogleAuthorizationFlowTokenResponse> {
    let credentials: Credentials | undefined;
    try {
      const response = await this.oauthClient.getToken(code);
      credentials = response.tokens;
    } catch (cause) {
      const errorDescription = decodeURIComponent((cause as any)?.response?.data?.error_description ?? 'Unknown');
      throw new AuthnException(`Could not validate token: ${errorDescription}`, {
        code: 'authn-invalid-code',
        cause,
        details: {
          response: (cause as any)?.response?.data,
        },
      });
    }

    // await this.getAuthnUserDataFromIdToken(credentials.id_token);
    // await this.getAuthnUserDataFromAccessToken(credentials.access_token);

    if (!credentials?.access_token) {
      throw new AuthnException('Could not obtain access token', { code: 'authn-no-access-token', details: {} });
    }

    return {
      accessToken: credentials.access_token,
      idToken: credentials.id_token || undefined,
      refreshToken: credentials.refresh_token || undefined,
    };
  }

  /**
   * Get user details from the authn provider
   */
  public async userData?(auth: IAuthnProviderIdentity): Promise<IAuthnUserData | null> {
    if (auth?.providerData?.token) {
      const token: TokenInfo | TokenPayload = auth?.providerData?.token;
      return {
        providerId: token.sub,
        email: token.email,
        emailVerified: token.email_verified,
        name: 'name' in token ? token.name : undefined,
        givenName: 'given_name' in token ? token.given_name : undefined,
        familyName: 'family_name' in token ? token.family_name : undefined,
        picture: 'picture' in token ? token.picture : undefined,
        providerData: { [GOOGLE_AUTHN_PROVIDER_NAME]: auth?.providerData },
      };
    }
    return null;
  }

  public async extractIdTokenPayload(idToken: string): Promise<TokenPayload | undefined> {
    const token = await this.oauthClient.verifyIdToken({
      idToken,
      audience: this.config.clientId,
    });
    return token.getPayload();
  }

  public async extractAccessTokenPayload(accessToken: string): Promise<TokenInfo | undefined> {
    return await this.oauthClient.getTokenInfo(accessToken);
  }

  onApplicationBootstrap(): any {
    this.loader.registerProvider(GOOGLE_AUTHN_PROVIDER_NAME, this);
  }

  health(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
