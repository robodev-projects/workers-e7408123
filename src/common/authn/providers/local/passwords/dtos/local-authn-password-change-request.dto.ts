import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

import { ILocalAuthnPasswordChangeRequest } from '../../local-authn.types';

export class LocalAuthnPasswordChangeRequestDto implements ILocalAuthnPasswordChangeRequest {
  /**
   * Set new password
   */
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MinLength(14)
  @Transform(({ value }) => value.toLowerCase())
  readonly password!: string;
}
