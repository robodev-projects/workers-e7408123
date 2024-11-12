import { Expose, Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

import { MediaAttachRequestDto } from '~common/media';

import type { IUserUpdate } from '../user.types';

export class UserUpdateDto implements IUserUpdate {
  /**
   * Email
   */
  @Expose()
  @IsEmail()
  readonly email!: string;

  /**
   * Profile Picture
   */
  @Expose()
  @Type(() => MediaAttachRequestDto)
  @ValidateNested()
  @IsOptional()
  readonly profilePicture?: MediaAttachRequestDto;
}
