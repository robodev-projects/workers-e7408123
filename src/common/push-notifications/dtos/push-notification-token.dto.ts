import { Expose } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

import type { IPushNotificationToken } from '../push-notification.types';

export class PushNotificationTokenDto {
  /**
   * Id
   */
  @Expose()
  @IsString()
  readonly id?: string;

  /**
   * Title
   * @example My Device
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly title?: string;

  /**
   * Token
   * @example My Device
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly token?: string;

  /**
   * Created At
   */
  @Expose()
  @IsDate()
  readonly createdAt!: Date;

  /**
   * Provider
   * @example fcm
   */
  @Expose()
  @IsString()
  readonly provider!: string;

  private constructor(data: PushNotificationTokenDto) {
    Object.assign(this, data);
  }

  static fromDomain(data: IPushNotificationToken): PushNotificationTokenDto {
    return new PushNotificationTokenDto(data);
  }
}
