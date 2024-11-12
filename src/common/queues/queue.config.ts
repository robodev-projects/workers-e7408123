import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToBoolean } from '~common/validate';

@ConfigDecorator('queues')
export class QueueConfig {
  @Expose()
  @IsBoolean()
  @TransformInputToBoolean()
  debug = false;
}
