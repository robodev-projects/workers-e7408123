import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { Auth0AuthorizationFlowToken } from '../auth0-authn.types';

export class Auth0AuthorizationFlowInstructionsDto {
  /**
   * Access token
   */
  @Expose()
  @IsString()
  readonly accessToken!: string;

  /**
   * Refresh token
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly refreshToken?: string;

  /**
   * Token type
   */
  @Expose()
  @IsString()
  readonly tokenType!: string;

  private constructor(data: Auth0AuthorizationFlowInstructionsDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: Auth0AuthorizationFlowToken): Auth0AuthorizationFlowInstructionsDto {
    return new Auth0AuthorizationFlowInstructionsDto({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
    });
  }
}
