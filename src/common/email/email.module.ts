import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { getConfigFactory } from '~common/config';
import { deferComposableModule } from '~common/utils/nestjs';

import { EmailTemplateCompiler } from './email-template.compiler';
import { EmailConfig } from './email.config';
import { EmailService } from './email.service';
import { EmailTemplateMetadataAccessor } from './loader/email-template-metadata.accessor';
import { EmailTemplateLoader } from './loader/email-template.loader';

@Module({})
export class EmailModule {
  static forRoot = deferComposableModule({
    module: EmailModule,
    imports: [DiscoveryModule],
    providers: [
      EmailService,
      getConfigFactory(EmailConfig),
      EmailTemplateLoader,
      EmailTemplateMetadataAccessor,
      EmailTemplateCompiler,
    ],
    exports: [EmailService],
  });
}
