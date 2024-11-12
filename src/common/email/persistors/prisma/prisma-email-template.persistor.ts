import { EmailTemplatePersistor } from '../../email-template-persistor.abstract';
import { EmailTemplateRepository } from './email-template.repository';

export class PrismaEmailTemplatePersistor implements EmailTemplatePersistor {
  constructor(private readonly emailTemplateRepository: EmailTemplateRepository) {}

  async findByName(name: string) {
    return this.emailTemplateRepository.findByName(name);
  }
}
