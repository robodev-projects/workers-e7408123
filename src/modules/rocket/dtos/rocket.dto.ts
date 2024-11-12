import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { MediaFetchInstructionsDto } from '~common/media';

import { IRocket } from '../rocket.types';

export class RocketDto implements IRocket {
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
  @IsString()
  readonly name!: string;

  /**
   * Model
   */
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly model!: string;

  /**
   * Picture
   */
  @Expose()
  @Type(() => MediaFetchInstructionsDto)
  @ValidateNested()
  @IsOptional()
  readonly picture?: MediaFetchInstructionsDto;

  /**
   * Time-lapse images
   */
  @Expose()
  @Type(() => MediaFetchInstructionsDto)
  @ValidateNested({ each: true })
  @IsOptional()
  readonly timelapses?: MediaFetchInstructionsDto[];

  private constructor(data: RocketDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IRocket): RocketDto {
    return new RocketDto(data);
  }
}
