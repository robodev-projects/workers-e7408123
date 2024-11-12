import { Injectable } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports -- todo
import { PrismaService } from '~database/prisma';

import type { IEmailTemplate } from '../../email.types';

@Injectable()
export class EmailTemplateRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByName(name: string): Promise<IEmailTemplate | null> {
    if (!name) {
      return null;
    }

    const emailTemplate = await this.prismaService.client.emailTemplate.findUnique({
      where: {
        type: name,
      },
    });

    if (!emailTemplate) {
      return null;
    }

    /*
       todo, database needs to be restructured to fit templates
        - style does not work in email clients, if its used it needs to be compiled in
        - type should be 'name'
        - contentType is actually the engine that renders the template
        - label/description are accounting
        - add a 'module' to better represent the templates
     */
    return {
      name: emailTemplate.type!,
      subject: emailTemplate.subject,
      html: emailTemplate.content,
      text: emailTemplate.textContent ?? '', // todo, text should be required
      engine: emailTemplate.contentType,
    } satisfies IEmailTemplate;
  }
}
