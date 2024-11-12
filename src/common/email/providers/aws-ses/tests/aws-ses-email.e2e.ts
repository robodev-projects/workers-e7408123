import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, beforeAll } from 'vitest';

import { EmailModule, EmailService } from '~common/email';
import { AwsSesEmailPlugin } from '~common/email/providers/aws-ses';
import { LoggerModule } from '~common/logger';

import { NoOpEmailTemplatePersistor } from '../../../persistors/no-op';

describe('AWS SES', () => {
  let app: INestApplication;
  let emailService: EmailService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule, EmailModule.forRoot([AwsSesEmailPlugin, NoOpEmailTemplatePersistor])],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    emailService = app.get(EmailService);
  });

  it('should send a test email using aws ses', async ({ expect }) => {
    const reply = await emailService.send({
      to: 'info@example.com',
      htmlContent: 'test',
      subject: 'test',
      textContent: 'test',
    });
    expect(reply.messageId).toBeDefined();
  });
});
