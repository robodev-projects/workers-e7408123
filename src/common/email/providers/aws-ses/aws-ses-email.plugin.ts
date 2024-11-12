import { type ModuleMetadata } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { EmailProvider } from '../../email-provider.abstract';
import { AwsSesEmailConfig } from './aws-ses-email.config';
import { AwsSesEmailProvider } from './aws-ses-email.provider';

export const AwsSesEmailPlugin: ModuleMetadata = {
  providers: [
    getConfigFactory(AwsSesEmailConfig),
    { provide: EmailProvider, useClass: AwsSesEmailProvider },
    AwsSesEmailProvider,
  ],
};
