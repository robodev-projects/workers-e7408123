import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToArray } from '~common/validate';

@ConfigDecorator('authn.google')
export class GoogleAuthnConfig {
  @Expose()
  @IsString()
  readonly clientId!: string;

  @Expose()
  @IsString()
  readonly clientSecret!: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  readonly authorizationFlowEnabled = false;

  @Expose()
  @IsOptional()
  @IsString()
  readonly authorizationFlowRedirectUrl = '/authn/provider/google/callback';

  /**
   * The callback URL for the authorization flow
   * @example /auth/callback
   */
  @Expose()
  @IsOptional()
  @IsString()
  readonly authorizationFlowCallbackUrl?: string;

  @Expose()
  @TransformInputToArray({ transformer: String })
  @IsArray()
  @IsString({ each: true })
  readonly scopes: string[] = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  @Expose()
  @IsUrl({ require_tld: false })
  readonly oauth2Url = 'https://accounts.google.com/o/oauth2/v2/auth';
}
