import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('authn.auth0')
export class Auth0AuthnConfig {
  @Expose()
  @IsUrl({ require_tld: false, require_protocol: true })
  readonly issuer!: string;

  @Expose()
  @IsString()
  readonly audience!: string;

  /**
   * Needed for the management API
   *  and the authorization flow
   */

  @Expose()
  @IsOptional()
  @IsString()
  readonly managementDomain?: string;

  @Expose()
  @IsOptional()
  @IsString()
  readonly clientId?: string;

  @Expose()
  @IsOptional()
  @IsString()
  readonly clientSecret?: string;

  /**
   * Authorization flow
   */

  @Expose()
  @IsOptional()
  @IsBoolean()
  readonly authorizationFlowEnabled?: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  readonly authorizationFlowRedirectUrl = '/authn/provider/auth0/callback';

  /**
   * The callback URL for the authorization flow
   * @example /auth/callback
   */
  @Expose()
  @IsOptional()
  @IsString()
  readonly authorizationFlowCallbackUrl?: string;

  @Expose()
  @IsOptional()
  @IsString()
  readonly authorizationFlowScope = 'openid profile email';

  @Expose()
  @IsOptional()
  @IsString()
  readonly authorizationFlowConnection = 'Username-Password-Authentication';

  /**
   * Local development has a different endpoint to the issuer
   */
  @Expose()
  @IsUrl({ require_tld: false, require_protocol: true })
  @IsOptional()
  readonly endpoint?: string;
}
