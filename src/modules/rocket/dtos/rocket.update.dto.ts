import { Expose, Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MediaAttachRequestDto } from '~common/media';

import type { IRocketUpdate } from '../rocket.types';

export class RocketUpdateDto implements IRocketUpdate {
  /**
   * ID
   */
  @Expose()
  @IsUUID('all')
  readonly id!: string;

  /**
   * Name
   */
  @Expose()
  @IsEmail()
  @IsOptional()
  readonly name!: string;

  /**
   * Model
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly model!: string;

  /**
   * Picture
   */
  @Expose()
  @ValidateNested()
  @Type(() => MediaAttachRequestDto)
  @IsOptional()
  readonly picture?: MediaAttachRequestDto;

  /**
   * Time-lapse images
   */
  @Expose()
  @Type(() => MediaAttachRequestDto)
  @ValidateNested({ each: true })
  @IsOptional()
  readonly timelapses?: MediaAttachRequestDto[];
}
