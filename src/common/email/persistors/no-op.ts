import { type ModuleMetadata } from '@nestjs/common';

import { EmailTemplatePersistor } from '../email-template-persistor.abstract';

export class NoOpEmailTemplateService implements EmailTemplatePersistor {
  async findByName() {
    return null;
  }
}

export const NoOpEmailTemplatePersistor: ModuleMetadata = {
  providers: [{ provide: EmailTemplatePersistor, useClass: NoOpEmailTemplateService }],
};
