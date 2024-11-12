import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LoggerService } from '~common/logger';
import { MediaService } from '~common/media';

import { AwsS3MediaConfig } from './aws-s3-media.config';
import type { AwsS3MediaWebhookValidateDto } from './dtos/aws-s3-media-webhook-validate.dto';

@ApiTags('Media')
@Controller('media/provider/s3/webhook')
export class AwsS3MediaWebhookController {
  constructor(
    private readonly config: AwsS3MediaConfig,
    private readonly mediaService: MediaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Capture S3 media upload callback
   *  - call this endpoint from a lambda that listens to S3 events
   * @example
   *  fetch('https://api.example.com/media/provider/s3/webhook/validate', {
   *    method: 'POST',
   *    data: {
   *       key: 'uploads/small-image/1234.jpg',
   *    }
   *  });
   *  - always return 200 OK to prevent retries
   */
  @Post('validate')
  async validateWebhook(@Body() dto: AwsS3MediaWebhookValidateDto): Promise<void> {
    if (!this.config.validationWebhookSecret || dto.secret !== this.config.validationWebhookSecret) {
      this.logger.error('Webhook secret mismatch');
      return;
    }
    try {
      const media = await this.mediaService.find({ key: dto.key });
      if (!media) {
        throw new NotFoundException('Media not found');
      }
      await this.mediaService.validate(media.id);
    } catch (error) {
      this.logger.error('Failed to validate media', error);
    }
  }
}
