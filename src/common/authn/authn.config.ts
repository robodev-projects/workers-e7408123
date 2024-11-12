import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ConfigDecorator } from '~common/config';

export class AuthnJWTConfig {
  @Expose()
  @IsString()
  readonly secret!: string;

  /**
   * Time (in seconds) to cache the user's permissions
   *  keep this short as users retain the access for the duration
   */
  @Expose()
  @IsNumber()
  readonly accessTokenExpiration = 5 * 60;

  /**
   * Time (in seconds) to cache the user's identity
   *  - this can be longer as we need to fetch new data ech time we make an access token
   */
  @Expose()
  @IsNumber()
  readonly refreshTokenExpiration = 7 * 24 * 60 * 60;
}

export class AuthnSessionConfig {
  /**
   * Extend the refresh token until it is valid
   */
  @Expose()
  @IsBoolean()
  readonly refreshTokenExtension = true;
}

@ConfigDecorator('authn')
export class AuthnConfig {
  @Expose()
  @ValidateNested()
  @Type(() => AuthnJWTConfig)
  @IsOptional()
  readonly jwt!: AuthnJWTConfig;

  @Expose()
  @ValidateNested()
  @Type(() => AuthnSessionConfig)
  @IsOptional()
  readonly session!: AuthnSessionConfig;
}
