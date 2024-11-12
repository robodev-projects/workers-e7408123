import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { IMediaUploadRequest } from '~common/media';

/**
 * Request to upload a media file, with file details
 */
export class MediaUploadRequestDto {
  /**
   * Resource name supported by the system
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly resourceName?: string;

  /**
   * Original filename
   * @example profile.png
   */
  @Expose()
  @IsString()
  readonly fileName!: string;

  /**
   * Original file size in bytes
   * @example 1024
   */
  @Expose()
  @Min(1)
  @IsNumber()
  readonly fileSize!: number;

  /**
   * File mime type
   * @example image/png
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly mimeType?: string;

  /**
   * Upload method
   * @example put
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly method?: string;

  public static toDomain(dto: MediaUploadRequestDto): Omit<IMediaUploadRequest, 'mimeType'> & { mimeType?: string } {
    return {
      resourceName: dto.resourceName,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
    };
  }
}
