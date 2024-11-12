import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Mock } from 'node:test';
import { afterAll, beforeAll, describe, it } from 'vitest';

import {
  MyEmailTemplate,
  MyEmailTemplateParameters,
  MyTemplateProvider,
} from '~common/email/tests/email-template.mock';
import { LoggerModule } from '~common/logger';

import { EmailProvider } from '../email-provider.abstract';
import { EmailModule } from '../email.module';
import { EmailService } from '../email.service';
import { NoOpEmailTemplatePersistor } from '../persistors/no-op';
import { NoOpEmailProviderPlugin } from '../providers/no-op';
import { EmailProviderMock } from '../tests/email.mock';

describe('EmailService', () => {
  let app: INestApplication;
  let emailService: EmailService;
  let emailProvider: Mock<any>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule, EmailModule.forRoot([NoOpEmailProviderPlugin, NoOpEmailTemplatePersistor])],
      providers: [MyTemplateProvider],
    })
      .overrideProvider(EmailProviderMock.provide)
      .useValue(EmailProviderMock.useValue)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    emailService = app.get(EmailService);
    emailProvider = app.get(EmailProvider);
  });

  afterAll(async () => {
    emailProvider.send.mock.resetCalls();
  });

  it('should compile the email template', async ({ expect }) => {
    await emailService.sendTemplate<MyEmailTemplateParameters>({ to: 'info@example.com' }, MyEmailTemplate.name, {
      code: '123456',
    });
    expect(emailProvider.send.mock.calls[0].arguments[0].htmlContent).toContain('This is your code: 123456.');
  });
});
