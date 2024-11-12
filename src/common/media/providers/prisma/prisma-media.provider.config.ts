import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToArray } from '~common/validate';

@ConfigDecorator('media.prisma')
export class PrismaMediaProviderConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  secret!: string;

  @Expose()
  @IsString()
  @IsOptional()
  publicUrl?: string;

  @Expose()
  @IsBoolean()
  @IsOptional()
  signFetch?: boolean;

  @Expose()
  @IsNumber()
  @IsOptional()
  signFetchExpiresIn: number = 60 * 15;

  /**
   * Upload methods
   */
  @Expose()
  @IsOptional()
  @IsString({ each: true })
  @TransformInputToArray()
  uploadMethods: string[] = ['post'];
}
