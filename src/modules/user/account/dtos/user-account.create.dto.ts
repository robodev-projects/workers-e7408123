import { Expose } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

import { IUserAccountCreate } from '../user-account.types';

export class UserAccountCreateDto implements IUserAccountCreate {
  /**
   * Email
   */
  @Expose()
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  /**
   * Name
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly name?: string;
}
