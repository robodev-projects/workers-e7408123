import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('push-notifications')
export class PushNotificationConfig {
  /**
   * Expose authenticated endpoints for token management
   */
  @Expose()
  @IsBoolean()
  @IsOptional()
  readonly tokenController?: boolean = false;
}
