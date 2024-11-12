import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Mock } from 'node:test';
import { afterAll, beforeAll, describe, it, test } from 'vitest';

import { AuthnModule } from '~common/authn';
import { NotImplementedAuthnPersistorPlugin } from '~common/authn/persistors/not-implemented';
import { HotwireAuthnPlugin } from '~common/authn/providers/hotwire';
import { LoggerModule } from '~common/logger';
import { PushNotificationLoader } from '~common/push-notifications/loader/push-notification.loader';

import { NotImplementedPushNotificationPersistorPlugin } from '../persistors/not-implemented';
import { PushNotificationProvider } from '../push-notification-provider.abstract';
import { PushNotificationModule } from '../push-notification.module';
import { PushNotificationService } from '../push-notification.service';
import { HelloUserTemplateService } from './push-notification-template.mock';
import { PushNotificationPersistorMock, PushNotificationProviderMock } from './push-notification.mock';

describe('PushNotificationService', () => {
  let app: INestApplication;
  let service: PushNotificationService;
  let pushNotificationProvider: PushNotificationProvider;

  const provider = PushNotificationProviderMock.provider;
  const token = {
    resourceName: 'user/1234',
    provider,
    token: '1234567890',
    expiresAt: new Date(Date.now() + 100000000),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        AuthnModule.forRoot([NotImplementedAuthnPersistorPlugin, HotwireAuthnPlugin]),
        PushNotificationModule.forRoot([NotImplementedPushNotificationPersistorPlugin]),
      ],
      providers: [HelloUserTemplateService],
    })
      .overrideProvider(PushNotificationPersistorMock.provide)
      .useValue(PushNotificationPersistorMock.useValue)
      .compile();

    app = moduleRef.createNestApplication();

    await app.init();

    service = app.get(PushNotificationService);
    app.get(PushNotificationLoader).providers = {
      // push notification providers are dynamically loaded
      [PushNotificationProviderMock.provider]: PushNotificationProviderMock.useValue,
    };
    pushNotificationProvider = PushNotificationProviderMock.useValue;
  });

  afterAll(async () => {});

  test('CRUD functions', async ({ expect }) => {
    expect(await service.deleteToken({ resourceName: token.resourceName })).toBeUndefined();
    expect(await service.listToken({ where: { resourceName: token.resourceName } })).toEqual(
      expect.arrayContaining([expect.objectContaining({ resourceName: token.resourceName })]),
    );
    expect(await service.registerToken(token)).toEqual(token);
  });

  it('should send messages', async ({ expect }) => {
    const reponse = await service.sendMessages({
      resourceName: token.resourceName,
      notification: {
        title: 'Hello',
      },
    });
    expect(reponse).toEqual(expect.arrayContaining([expect.objectContaining({ response: 'mock-id' })]));
  });

  it('should send templated messages', async ({ expect }) => {
    const { mock } = pushNotificationProvider.sendMessage as Mock<typeof pushNotificationProvider.sendMessage>;
    mock.resetCalls();
    const response = await service.sendMessagesTemplate(
      {
        resourceName: token.resourceName,
      },
      'hello-user',
      { name: 'John' },
    );
    expect(response).toEqual(expect.arrayContaining([expect.objectContaining({ response: 'mock-id' })]));
    expect(mock.calls[0].arguments[0]?.notification?.title).toEqual('Hello, John!');
  });
});
