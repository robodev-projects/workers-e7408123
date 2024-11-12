import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IAuthnToken } from '../authn.types';

export class AuthnTokenDto implements IAuthnToken {
  /**
   * Access Token
   *  - use to authenticate requests with `Authorization: Bearer ${token}`
   *  - read { exp: number } from the token to determine when it expires
   */
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly accessToken!: string;

  /**
   * Refresh Token
   *  - use to get a new access token when the current one expires
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly refreshToken?: string;

  constructor(data: AuthnTokenDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IAuthnToken): AuthnTokenDto {
    return new AuthnTokenDto(data);
  }
}
