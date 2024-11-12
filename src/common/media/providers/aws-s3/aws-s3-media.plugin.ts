import { type ModuleMetadata } from '@nestjs/common';

import { getConfig, getConfigFactory } from '~common/config';

import { AwsS3MediaWebhookController } from './aws-s3-media-webhook.controller';
import { AwsS3MediaConfig } from './aws-s3-media.config';
import { AwsS3MediaProvider } from './aws-s3-media.provider';

const config = getConfig(AwsS3MediaConfig);

export const AwsS3MediaPlugin: ModuleMetadata = {
  providers: [getConfigFactory(AwsS3MediaConfig), AwsS3MediaProvider],
  controllers: [...(config.validationWebhookSecret ? [AwsS3MediaWebhookController] : [])],
};
