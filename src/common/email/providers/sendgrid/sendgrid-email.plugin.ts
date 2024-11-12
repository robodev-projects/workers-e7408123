import { type ModuleMetadata } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { EmailProvider } from '../../email-provider.abstract';
import { SendgridEmailConfig } from './sendgrid-email.config';
import { SendgridEmailProvider } from './sendgrid-email.provider';

export const SendgridEmailPlugin: ModuleMetadata = {
  providers: [getConfigFactory(SendgridEmailConfig), { provide: EmailProvider, useClass: SendgridEmailProvider }],
};
