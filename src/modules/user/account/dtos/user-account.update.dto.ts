import { Expose, Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

import { MediaAttachRequestDto } from '~common/media';

import { IUserAccountUpdate } from '../user-account.types';

export class UserAccountUpdateDto implements IUserAccountUpdate {
  /**
   * Name
   */
  @Expose()
  @IsEmail()
  @IsOptional()
  readonly name?: string;

  /**
   * Email
   */
  @Expose()
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  /**
   * Profile Picture
   */
  @Expose()
  @Type(() => MediaAttachRequestDto)
  @ValidateNested()
  @IsOptional()
  readonly profilePicture?: MediaAttachRequestDto;
}
