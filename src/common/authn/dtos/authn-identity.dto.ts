import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import type { IAuthnIdentity } from '../authn.types';

export class AuthnIdentityDto implements Partial<IAuthnIdentity> {
  /**
   * User ID
   */
  @Expose()
  @IsString()
  readonly userId!: string;

  /**
   * Authn ID
   */
  @Expose()
  @IsString()
  readonly id!: string;

  /**
   * Type of user
   */
  @Expose()
  @IsString()
  readonly type!: string;

  /**
   * Name of the identity provider
   */
  @Expose()
  @IsString()
  readonly provider!: string;

  /**
   * Name of the identity provider
   */
  @Expose()
  @IsString()
  readonly providerId!: string;

  private constructor(data: IAuthnIdentity) {
    Object.assign(this, data);
  }

  static fromDomain(data: IAuthnIdentity): AuthnIdentityDto {
    return new AuthnIdentityDto(data);
  }
}
