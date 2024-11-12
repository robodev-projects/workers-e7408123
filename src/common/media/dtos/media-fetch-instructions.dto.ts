import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { IMediaFetchInstructions } from '../media.types';

export class MediaFetchInstructionsDto implements IMediaFetchInstructions {
  /**
   * Url to media
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly url?: string;

  /**
   * Media Id
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly id?: string;

  constructor(data: MediaFetchInstructionsDto) {
    return Object.assign(this, data);
  }
}
