import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PushNotificationTokenCreateDto {
  /**
   * Token
   */
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly token!: string;

  /**
   * Title
   * @example My Device
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly title?: string;

  /**
   * Provider
   * @example fcm
   */
  @Expose()
  @IsString()
  readonly provider!: string;

  /**
   * Replace existing tokens assigned to other resources
   * @example false
   */
  @Expose()
  @IsBoolean()
  @IsOptional()
  readonly replace!: boolean;
}
