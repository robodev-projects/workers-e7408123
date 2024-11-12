import type { ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { mock } from 'node:test';

import { EmailProvider } from '../email-provider.abstract';
import { EmailTemplatePersistor } from '../email-template-persistor.abstract';
import { EmailService } from '../email.service';
import type { IEmailSendResponse, IEmailTemplate } from '../email.types';

/**
 * Mock all calls to EmailService
 */
export const EmailServiceMock: ValueProvider = {
  provide: EmailService,
  useValue: {
    send: mock.fn(() => {
      return { messageId: 'mock-id' };
    }),
    sendTemplate: mock.fn(() => {
      return { messageId: 'mock-id', response: null } satisfies IEmailSendResponse;
    }),
  },
};

/**
 * Mock calls to Email Providers
 */
export const EmailProviderMock: ValueProvider = {
  provide: EmailProvider,
  useValue: {
    send: mock.fn(() => {
      return { messageId: 'mock-id', response: null } satisfies IEmailSendResponse;
    }),
    preprocess: mock.fn((a) => a),
  },
};

/**
 * Mock Fetching Email Templates
 */
export const EmailTemplatePersistorMock: ValueProvider = {
  provide: EmailTemplatePersistor,
  useValue: {
    findByName: mock.fn((name: string) => {
      return { name, engine: 'none', html: '', text: '', subject: '' } satisfies IEmailTemplate;
    }),
  },
};
