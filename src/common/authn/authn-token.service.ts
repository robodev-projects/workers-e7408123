import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { AuthnConfig } from './authn.config';
import { IAuthnJWTToken } from './authn.types';

@Injectable()
export class AuthnTokenService {
  constructor(private readonly authnConfig?: AuthnConfig) {
    this.secret = this.authnConfig?.jwt?.secret;
  }

  private secret?: string;

  public async createToken(
    payload: Omit<Record<string, any>, 'id' | 'sub' | 'aud' | 'exp' | 'iat'>,
    options: { expiresAt: number; audience: string; prefix?: string },
  ): Promise<[string, IAuthnJWTToken]> {
    if (!this.secret) {
      throw new Error('JWT signing is not configured');
    }

    const iat = Math.floor(Date.now() / 1000);
    const tokenData: IAuthnJWTToken = {
      ...payload,
      iat,
      exp: options.expiresAt,
      aud: options?.audience,
    };

    const token = await this.sign(tokenData);

    return [options.prefix ? `${options.prefix}${token}` : token, tokenData];
  }

  public async verifyToken(
    rawToken: string,
    options: { audience: string; prefix?: string },
  ): Promise<IAuthnJWTToken | null> {
    if (!this.secret) {
      throw new Error('JWT signing is not configured');
    }

    if (!rawToken) {
      throw new Error('No token provided');
    }

    const token = options.prefix ? rawToken.replace(RegExp('^' + options.prefix), '') : rawToken;

    const decoded = await this.decode(token);

    if (decoded.aud !== options.audience) {
      return null;
    }

    try {
      // check exp and signature
      await this.verify(token);
    } catch (err: any) {
      return null;
    }

    return decoded as IAuthnJWTToken;
  }

  private async verify(token: string) {
    if (!this.secret) {
      throw new Error('JWT signing is not configured');
    }
    if (!token) {
      throw new Error('No token provided');
    }
    return jwt.verify(token, this.secret);
  }

  private async decode(token: string) {
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== 'object') {
      throw new Error('Invalid token');
    }
    return decoded;
  }

  private async sign(payload: Record<string, any>, options?: jwt.SignOptions) {
    if (!this.secret) {
      throw new Error('JWT signing is not configured');
    }
    return jwt.sign(payload, this.secret, options);
  }
}
