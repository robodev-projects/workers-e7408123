import { HttpStatus, Injectable } from '@nestjs/common';

import { InternalServerErrorException } from '~common/exceptions';
import { makeId } from '~common/utils/short-uuid';

import { AuthnTokenService } from '../../authn-token.service';
import { AuthnConfig } from '../../authn.config';
import { IAuthnJWTToken, IAuthnToken } from '../../authn.types';
import { LocalAuthnPersistor } from './local-authn-persistor.abstract';
import { LocalAuthnConfig } from './local-authn.config';
import { LocalAuthnException } from './local-authn.exceptions';
import { ILocalAuthnIdentity, ILocalAuthnIdentityCreate } from './local-authn.types';

@Injectable()
export class LocalAuthnService {
  constructor(
    private readonly localAuthnPersistor: LocalAuthnPersistor,
    private readonly localAuthnConfig: LocalAuthnConfig,
    private readonly authnConfig: AuthnConfig,
    private readonly authnTokenService: AuthnTokenService,
  ) {}

  async find(where: { id: string } | { email: string }): Promise<ILocalAuthnIdentity | null> {
    return await this.localAuthnPersistor.findLocalIdentity(where);
  }

  async create(data: ILocalAuthnIdentityCreate): Promise<ILocalAuthnIdentity> {
    const localIdentity = await this.localAuthnPersistor.findLocalIdentity({ email: data.email });
    if (localIdentity) {
      throw new LocalAuthnException('Local identity already exists', {
        code: 'local-authn-identity-exists',
        httpStatus: HttpStatus.BAD_REQUEST,
        level: 'log',
      });
    }
    return await this.localAuthnPersistor.createLocalIdentity(data);
  }

  async update(
    where: { id: string } | { email: string },
    data: Partial<ILocalAuthnIdentity>,
  ): Promise<ILocalAuthnIdentity> {
    return await this.localAuthnPersistor.updateLocalIdentity(where, data);
  }

  /**
   * Create tokens for the local authn identity
   */
  async createTokens(localAuthnIdentity: ILocalAuthnIdentity): Promise<IAuthnToken> {
    const [refreshToken, refreshTokenData] = this.localAuthnConfig.refreshToken
      ? await this.authnTokenService.createToken(
          {
            sid: makeId(),
            uid: localAuthnIdentity.id,
          },
          {
            expiresAt: Math.floor(Date.now() / 1000) + this.authnConfig.jwt.refreshTokenExpiration,
            audience: 'local:refresh',
            prefix: 'local:',
          },
        )
      : [undefined, undefined];

    const [accessToken] = await this.authnTokenService.createToken(
      {
        uid: localAuthnIdentity.id,
        ...(refreshTokenData ? { sid: refreshTokenData.sid } : {}),
      },
      {
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 30, // 30min,
        audience: 'local:access',
        prefix: 'local:',
      },
    );
    return { accessToken, refreshToken };
  }

  async accessToken(refreshToken: string): Promise<IAuthnToken> {
    if (!this.localAuthnConfig.refreshToken) {
      throw new InternalServerErrorException('Refresh token is disabled', 'refresh-token-disabled');
    }

    const refreshTokenData = await this.authnTokenService.verifyToken(refreshToken, {
      audience: 'local:refresh',
      prefix: 'local:',
    });

    if (!refreshTokenData) {
      throw new LocalAuthnException('Invalid refresh token', { code: 'invalid-refresh-token' });
    }

    const localIdentity = await this.localAuthnPersistor.findLocalIdentity({ id: refreshTokenData.uid });

    if (!localIdentity || localIdentity.disabled) {
      throw new InternalServerErrorException('Identity not found');
    }

    const [newRefreshToken] = (
      this.authnConfig.session?.refreshTokenExtension
        ? refreshTokenData.exp - Math.floor(Date.now() / 1000) < this.authnConfig.jwt.refreshTokenExpiration * 0.2
        : false
    )
      ? await this.authnTokenService.createToken(
          { uid: refreshTokenData.uid, sid: refreshTokenData.sid },
          {
            audience: 'local:refresh',
            prefix: 'local:',
            expiresAt: Math.floor(Date.now() / 1000) + this.authnConfig.jwt.refreshTokenExpiration,
          },
        )
      : [undefined, undefined];

    const [accessToken] = await this.authnTokenService.createToken(
      {
        uid: localIdentity.id,
        ...(refreshTokenData ? { sid: refreshTokenData.sid } : {}),
      },
      {
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 30, // 30min,
        audience: 'local:access',
        prefix: 'local:',
      },
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async verifyToken(rawToken: string): Promise<IAuthnJWTToken | null> {
    const token = this.authnTokenService.verifyToken(rawToken, { audience: 'local:access', prefix: 'local:' });

    if (!token) {
      return null;
    }

    return token;
  }
}
