import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { AuthnLoader } from '~common/authn/authn.loader';
import { AUTHN_SESSION_PROVIDER_NAME } from '~common/authn/session/authn-session.types';
import { BadRequestException } from '~common/exceptions';
import { KVStoreProvider } from '~common/kvstore';
import { LoggerService } from '~common/logger';
import { makeId } from '~common/utils/short-uuid';

import { AuthnProvider } from '../authn-provider.abstract';
import { AuthnTokenService } from '../authn-token.service';
import { AuthnConfig } from '../authn.config';
import { IAuthnIdentity, IAuthnJWTToken, IAuthnProviderIdentity, IAuthnSession } from '../authn.types';

@Injectable()
export class AuthnSessionProvider implements AuthnProvider, OnApplicationBootstrap {
  constructor(
    private readonly authnConfig: AuthnConfig,
    private readonly authnTokenService: AuthnTokenService,
    private readonly kvStore: KVStoreProvider<IAuthnSession>,
    private readonly loader: AuthnLoader,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Register the authn provider
   */
  onApplicationBootstrap(): any {
    this.loader.registerProvider(AUTHN_SESSION_PROVIDER_NAME, this);
  }

  /**
   * Create and persist session, create long-lived refresh token
   */
  public async createSession(
    data: { userId: string; authnId: string; userType: string },
    sessionPayload?: Record<string, any>,
    tokenPayload?: Record<string, any>,
  ) {
    if (!data.userId || !data.authnId) {
      throw new Error('Invalid identity data');
    }
    const sessionId = makeId();

    const expiresAt = Math.floor(Date.now() / 1000) + this.authnConfig.jwt.refreshTokenExpiration;

    // create refresh token
    const [refreshToken, refreshTokenData] = await this.authnTokenService.createToken(
      {
        ...(tokenPayload || {}),
        uid: data.userId, // needed to resolve session
        sid: sessionId,
      },
      {
        expiresAt,
        audience: 'session:refresh',
        prefix: 'session:',
      },
    );

    const session: IAuthnSession = {
      createdAt: refreshTokenData.iat,
      expiresAt: refreshTokenData.exp,
      sessionId,
      authnId: data.authnId,
      userId: data.userId,
      userType: data.userType,
      payload: sessionPayload || {},
    };

    if (
      !(await this.kvStore.set(sessionId, data.userId, session, refreshTokenData.exp - Math.floor(Date.now() / 1000)))
    ) {
      throw new Error('Failed to create session');
    }

    return {
      session,
      refreshToken,
      refreshTokenData,
    };
  }

  /**
   * Create short-lived access token
   */
  public async createAccessToken(session: { sessionId: string; userId: string }, payload?: Record<string, any>) {
    const expiresAt = Math.floor(Date.now() / 1000) + this.authnConfig.jwt.accessTokenExpiration;
    const [token, data] = await this.authnTokenService.createToken(
      {
        ...(payload || {}),
        uid: session.userId,
        sid: session.sessionId,
      },
      {
        expiresAt,
        audience: 'session:access',
        prefix: 'session:',
      },
    );
    return { accessToken: token, accessTokenData: data };
  }

  /**
   * Update session data, return a new refresh token
   *  extend the refresh token expiration if the refresh token is more than 20% of its expiration time
   */
  public async updateSession(
    session: { sessionId: string; userId: string },
    sessionPayload?: Record<string, any>,
    tokenPayload?: Record<string, any>,
  ) {
    const existing = await this.kvStore.get(session.sessionId, session.userId);
    if (!existing) {
      throw new BadRequestException('Invalid session');
    }

    const expiresAt = this.authnConfig.session.refreshTokenExtension
      ? Math.floor(Date.now() / 1000) + this.authnConfig.jwt.refreshTokenExpiration
      : existing.expiresAt;

    // create refresh token
    const [refreshToken, refreshTokenData] = await this.authnTokenService.createToken(
      {
        ...(tokenPayload || {}),
        uid: existing.userId, // needed to resolve session
        sid: session.sessionId,
      },
      {
        expiresAt,
        audience: 'session:refresh',
        prefix: 'session:',
      },
    );

    const updated: IAuthnSession = {
      sessionId: session.sessionId,
      expiresAt,
      authnId: existing.authnId,
      userId: session.userId,
      userType: existing.userType,
      createdAt: existing.createdAt,
      payload: sessionPayload || existing.payload || {},
    };

    if (
      !(await this.kvStore.set(session.sessionId, session.userId, updated, expiresAt - Math.floor(Date.now() / 1000)))
    ) {
      throw new Error('Failed to update session');
    }
    return {
      session: updated,
      refreshToken,
      refreshTokenData,
    };
  }

  /**
   * Check token signature and expiration, return unpacked token data
   */
  public async verifySessionToken(
    token: string,
    audience: 'session:access' | 'session:refresh',
  ): Promise<IAuthnJWTToken | null> {
    return await this.authnTokenService.verifyToken(token, { audience, prefix: 'session:' });
  }

  /**
   * Verify session token, resolve session data
   */
  public async resolveSession(
    token: string | IAuthnJWTToken,
    audience: 'session:access' | 'session:refresh',
  ): Promise<{ session: IAuthnSession; token: IAuthnJWTToken; shouldExtend: boolean }> {
    const tokenData = typeof token === 'string' ? await this.verifySessionToken(token, audience) : token;

    if (!tokenData) {
      throw new BadRequestException('Invalid auth token');
    }

    const session = await this.kvStore.get(tokenData.sid, tokenData.uid);

    if (!session) {
      throw new BadRequestException('Invalid session');
    }

    return {
      token: tokenData,
      session,

      // if the refresh token is more than 20% of its expiration time
      shouldExtend: this.authnConfig.session?.refreshTokenExtension
        ? tokenData.exp - Math.floor(Date.now() / 1000) < this.authnConfig.jwt.refreshTokenExpiration * 0.2
        : false,
    };
  }

  public async deleteSession(sessionId: string, userId: string) {
    return this.kvStore.delete(sessionId, userId);
  }

  public async listSessions(userId: string): Promise<IAuthnSession[]> {
    const sessions: IAuthnSession[] = [];
    for await (const [, session] of this.kvStore.list(userId)) {
      sessions.push(session);
    }
    return sessions;
  }

  public async deleteSessions(userId: string) {
    return this.kvStore.clear(userId);
  }

  public async resolveAuthnProviderIdentity(options: {
    headers: Record<string, any>;
  }): Promise<IAuthnProviderIdentity | null> {
    if (!options.headers.authorization) {
      return null;
    }
    const match = options.headers.authorization?.match(/^Bearer (session:(.+))$/);

    if (match) {
      try {
        const token = await this.verifySessionToken(match[1], 'session:access');
        if (token) {
          return {
            provider: AUTHN_SESSION_PROVIDER_NAME,
            providerId: token.sid,
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

  public async resolveAuthnIdentity(auth: IAuthnProviderIdentity): Promise<IAuthnIdentity | null> {
    if (auth.providerData?.token) {
      const { session } = await this.resolveSession(auth.providerData.token, 'session:access');
      return {
        ...auth,
        providerData: { ...auth.providerData, session },
        userId: session.userId,
        type: session.userType,
        createdAt: new Date(session.createdAt * 1000),
        id: session.authnId,
        disabled: false, // todo, disabling users would need to invalidate all sessions
      };
    }
    return null;
  }

  health(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
