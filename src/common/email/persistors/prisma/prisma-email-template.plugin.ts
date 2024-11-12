import { type ModuleMetadata } from '@nestjs/common';

import { EmailTemplatePersistor } from '../../email-template-persistor.abstract';
import { EmailTemplateRepository } from './email-template.repository';
import { PrismaEmailTemplatePersistor } from './prisma-email-template.persistor';

/**
 * Store email templates using Prisma
 */
export const PrismaEmailTemplatePlugin: ModuleMetadata = {
  providers: [EmailTemplateRepository, { provide: EmailTemplatePersistor, useClass: PrismaEmailTemplatePersistor }],
};
