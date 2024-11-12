import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToArray, TransformInputToBoolean } from '~common/validate';

import { IsEmailWithOptionalName } from './validators/email-with-optional-name.validator';

@ConfigDecorator('email')
export class EmailConfig {
  /**
   * Email sending mode
   * - enabled: send emails
   * - disabled: throw an error when sending emails
   * - no-op: log emails but do not send
   */
  @Expose()
  @IsString()
  @TransformInputToBoolean()
  mode: 'enabled' | 'disabled' | 'no-op' = 'enabled';

  @Expose()
  @IsOptional()
  @IsEmailWithOptionalName()
  defaultFrom?: string;

  @Expose()
  @IsOptional()
  @TransformInputToArray({ transformer: String })
  @IsEmailWithOptionalName({ each: true })
  defaultReplyTo?: string[];

  @Expose()
  @IsBoolean()
  @TransformInputToBoolean()
  enableLocalTemplates = true;

  @Expose()
  @IsBoolean()
  @TransformInputToBoolean()
  debug = false;
}
