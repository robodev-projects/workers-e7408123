import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('media')
export class MediaConfig {
  @Expose()
  @IsOptional()
  @IsString()
  defaultProvider?: string;
}
