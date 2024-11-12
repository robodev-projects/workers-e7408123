import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ConfigDecorator } from '~common/config';

export class LocalAuthnMagicLinkConfig {
  /**
   * Enable registration via magic link
   */
  @Expose()
  @IsBoolean()
  readonly registration!: string;

  /**
   * Redirect URL after registration
   * @example /auth/callback
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly registrationRedirect?: string;
}

export class LocalAuthnPasswordConfig {
  /**
   * Enable registration via email/password
   *  alternatives are to register a user from the User module at User creation
   *  while the 2-step system seems unintuitive, it's the same flow as with external providers
   */
  @Expose()
  @IsBoolean()
  readonly registration!: boolean;
}

@ConfigDecorator('authn.local')
export class LocalAuthnConfig {
  @Expose()
  @ValidateNested()
  @Type(() => LocalAuthnMagicLinkConfig)
  @IsOptional()
  readonly magicLinks!: LocalAuthnMagicLinkConfig;

  @Expose()
  @ValidateNested()
  @Type(() => LocalAuthnPasswordConfig)
  @IsOptional()
  readonly passwords!: LocalAuthnPasswordConfig;

  /**
   * Enable refresh token support
   *  - alternative to sessions
   */
  @Expose()
  @IsBoolean()
  @IsOptional()
  readonly refreshToken!: boolean;

  /**
   * Extend the refresh token until it is valid
   */
  @Expose()
  @IsBoolean()
  @IsOptional()
  readonly refreshTokenExtension = true;
}
