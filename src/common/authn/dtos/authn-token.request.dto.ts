import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthnTokenRequestDto {
  /**
   * Refresh Token
   *  - use to get a new access token when the current one expires
   */
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly refreshToken!: string;
}
