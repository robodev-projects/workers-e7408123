import { Expose, Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MediaFetchInstructionsDto } from '~common/media';

import { IUser } from '../user.types';

export class UserDto {
  /**
   * ID
   */
  @Expose()
  @IsUUID('all')
  readonly id!: string;

  /**
   * Email
   */
  @Expose()
  @IsEmail()
  @IsOptional()
  readonly name?: string;

  /**
   * Name
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly email?: string;

  /**
   * Profile picture
   */
  @Expose()
  @Type(() => MediaFetchInstructionsDto)
  @ValidateNested()
  @IsOptional()
  readonly profilePicture?: MediaFetchInstructionsDto;

  private constructor(data: UserDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IUser): UserDto {
    return new UserDto(data);
  }
}
