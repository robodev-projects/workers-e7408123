import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

import { ILocalAuthnPasswordRegistrationRequest } from '../../local-authn.types';

export class LocalAuthnPasswordRegistrationRequestDto implements ILocalAuthnPasswordRegistrationRequest {
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
  @MinLength(12)
  readonly password!: string;
}
