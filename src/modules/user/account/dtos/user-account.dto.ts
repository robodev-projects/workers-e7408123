import { Expose, Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';

import { MediaFetchInstructionsDto } from '~common/media';

import { IUserAccount } from '../user-account.types';

export class UserAccountDto implements IUserAccount {
  /**
   * Email
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly name?: string;

  /**
   * Name
   */
  @Expose()
  @IsEmail()
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

  private constructor(data: UserAccountDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IUserAccount): UserAccountDto {
    return new UserAccountDto({
      ...data,
      profilePicture: data.profilePicture ? new MediaFetchInstructionsDto(data.profilePicture) : undefined,
    });
  }
}
