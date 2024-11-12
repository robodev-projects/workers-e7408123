import type { ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { mock } from 'node:test';

import { PushNotificationPersistor } from '../push-notification-persistor.abstract';
import { PushNotificationProvider } from '../push-notification-provider.abstract';
import { type IPushNotificationToken } from '../push-notification.types';

const examplePushNotificationToken: IPushNotificationToken = {
  id: 'mock-id',
  resourceName: 'mock/12345',
  token: '1234567890',
  provider: 'mock-provider',
  expiresAt: new Date(Date.now() + 100000000),
  createdAt: new Date(),
};

/**
 * Mock calls to PushNotification Persistor
 */
export const PushNotificationPersistorMock: ValueProvider = {
  provide: PushNotificationPersistor,
  useValue: {
    findToken: mock.fn(() => {
      return examplePushNotificationToken;
    }),
    listToken: mock.fn(
      (options: {
        where: {
          id: string | string[];
          resourceName: string | string[];
          token: string | string[];
        };
      }) => {
        let items = [examplePushNotificationToken];
        for (const [key, value] of Object.entries(options?.where)) {
          switch (key) {
            case 'id':
            case 'resourceName':
            case 'token':
              items = Array.isArray(value)
                ? value.map((v) => ({ ...examplePushNotificationToken, [key]: v }))
                : [{ ...examplePushNotificationToken, [key]: value }];
              break;
          }
        }
        return items;
      },
    ),
    createToken: mock.fn((a) => {
      return a;
    }),
    updateToken: mock.fn((a, b) => {
      return { ...examplePushNotificationToken, ...a, ...b };
    }),
    deleteToken: mock.fn(() => {
      return;
    }),
  },
};

/**
 * Mock calls to PushNotification Provider
 */
export const PushNotificationProviderMock: ValueProvider & { provider: string } = {
  provider: examplePushNotificationToken.provider,
  provide: PushNotificationProvider,
  useValue: {
    sendMessage: mock.fn((a) => {
      return [{ ...a, response: 'mock-id' }];
    }),
    subscribeToTopic: mock.fn((a) => {
      return a;
    }),
    unsubscribeFromTopic: mock.fn((a) => {
      return a;
    }),
    validate: mock.fn((a) => {
      return a;
    }),
  },
};
