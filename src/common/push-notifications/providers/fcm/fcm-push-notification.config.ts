import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('push-notifications.fcm')
export class FcmPushNotificationConfig {
  @Expose()
  @IsString()
  @IsOptional()
  readonly privateKey?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly clientEmail?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly projectId?: string;
}
