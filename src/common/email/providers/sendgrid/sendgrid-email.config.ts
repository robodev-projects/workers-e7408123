import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ConfigDecorator } from '~common/config';

class SendgridEmailTemplateConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly id!: string;
}

@ConfigDecorator('email.sendgrid')
export class SendgridEmailConfig {
  @Expose()
  @IsString()
  @IsNotEmpty()
  readonly apiKey!: string;

  @Expose()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => SendgridEmailTemplateConfig)
  readonly templates?: SendgridEmailTemplateConfig[];
}
