import { Expose } from 'class-transformer';
import { Allow, IsOptional } from 'class-validator';

import type { IMediaUploadInstructions } from '../media.types';

export class MediaUploadInstructionsDto {
  /**
   * Method to upload with - PUT, POST, or custom instructions
   */
  @Expose()
  @IsOptional()
  readonly method?: string;

  /**
   * Url to upload to
   */
  @Expose()
  @IsOptional()
  readonly url?: string;

  /**
   * Additional fields for the POST upload
   */
  @Expose()
  @IsOptional()
  @Allow()
  readonly fields?: Array<[string, string]>;

  /**
   * Media ID
   */
  @Expose()
  @IsOptional()
  readonly id?: string;

  constructor(data: MediaUploadInstructionsDto) {
    return Object.assign(this, data);
  }

  static fromDomain(data: IMediaUploadInstructions) {
    return new MediaUploadInstructionsDto(data);
  }
}
