import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, beforeAll, it } from 'vitest';

import { LoggerModule } from '~common/logger';

import { EmailModule } from '../../../email.module';
import { EmailService } from '../../../email.service';
import { NoOpEmailTemplatePersistor } from '../../../persistors/no-op';
import { NoOpEmailProviderPlugin } from '../../../providers/no-op';
import { SendgridEmailPlugin } from '../sendgrid-email.plugin';

describe('Sendgrid Email Provider', () => {
  let app: INestApplication;
  let emailService: EmailService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        EmailModule.forRoot([SendgridEmailPlugin, NoOpEmailProviderPlugin, NoOpEmailTemplatePersistor]),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    emailService = app.get(EmailService);
  });

  it('should send a test email using sendgrid', async ({ expect }) => {
    const reply = await emailService.send({
      to: 'marko.zabreznik@povio.com',
      htmlContent: 'Sample text',
      subject: 'Sample subject',
      textContent: 'Sample text',
    });
    expect(reply.messageId).toBeDefined();
  });

  it.skip('should send a email using sendgrid dynamic templates', async ({ expect }) => {
    /**
     * This test requires a dynamic template to be created in sendgrid
     *  and its id to be set in the config
     *
     * @example
     *  email:
     *   sendgrid:
     *    apiKey: "SG.000000000"
     *    templates:
     *     - name: "MY_DYNAMIC_TEMPLATE"
     *       id: "d-99012ea31cad41a68511a8e6c9bfd28d"
     */
    const reply = await emailService.sendTemplate(
      {
        to: 'marko.zabreznik@povio.com',
      },
      'MY_DYNAMIC_TEMPLATE',
      {
        name: 'DynamicName',
      },
    );
    expect(reply.messageId).toBeDefined();
  });
});
