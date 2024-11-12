import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ConfigDecorator } from '~common/config';

/**
 * AWS SES Server Config
 *  - used for mocking
 *  - or a non-AWS SES compatible service
 */
class AwsSesEmailServerConfig {
  @Expose()
  @IsString()
  @IsOptional()
  apiEndpoint?: string;

  @Expose()
  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @Expose()
  @IsString()
  @IsOptional()
  secretAccessKey?: string;

  @Expose()
  @IsString()
  @IsOptional()
  region?: string;
}

export class AwsSesEmailTags {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  value!: string;
}

@ConfigDecorator('email.awsSes')
export class AwsSesEmailConfig extends AwsSesEmailServerConfig {
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AwsSesEmailTags)
  tags?: AwsSesEmailTags[];
}
