import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { AuthnTokenDto } from '~common/authn';

export class GoogleAuthnAuthnTokenDto extends AuthnTokenDto {
  /**
   * Id Token
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly idToken?: string;

  private constructor(data: AuthnTokenDto) {
    super(data);
  }

  static fromDomain(data: { refreshToken?: string; accessToken: string; idToken?: string }): GoogleAuthnAuthnTokenDto {
    return new GoogleAuthnAuthnTokenDto(data);
  }
}
