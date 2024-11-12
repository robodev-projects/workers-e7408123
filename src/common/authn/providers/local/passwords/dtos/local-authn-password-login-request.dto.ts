import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ILocalAuthnPasswordLoginRequest } from '../../local-authn.types';

export class LocalAuthnPasswordLoginRequestDto implements ILocalAuthnPasswordLoginRequest {
  /**
   * Email
   */
  @Expose()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  readonly email!: string;

  /**
   * Password
   */
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly password!: string;
}
