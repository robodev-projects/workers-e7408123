import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class AwsS3MediaWebhookValidateDto {
  @Expose()
  @IsString()
  readonly secret!: string;

  @Expose()
  @IsString()
  readonly key!: string;
}
