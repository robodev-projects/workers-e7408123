import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import admin from 'firebase-admin';

import { BadRequestException } from '~common/exceptions';

import { PushNotificationLoader } from '../../loader/push-notification.loader';
import { PushNotificationProvider } from '../../push-notification-provider.abstract';
import type {
  IPushNotificationMessage,
  IPushNotificationMessageResponse,
  IPushNotificationSubscriptionResponse,
} from '../../push-notification.types';
import { FcmPushNotificationConfig } from './fcm-push-notification.config';

export const FCM_PUSH_NOTIFICATION_PROVIDER_NAME = 'fcm';

@Injectable()
export class FcmPushNotificationProvider implements PushNotificationProvider, OnApplicationBootstrap {
  constructor(
    private readonly config: FcmPushNotificationConfig,
    private readonly loader: PushNotificationLoader,
  ) {
    if (!FcmPushNotificationProvider.messaging) {
      // todo, figure out why we need a singleton
      admin.initializeApp({
        projectId: config.projectId,
        credential: admin.credential.cert({
          projectId: this.config.projectId,
          clientEmail: this.config.clientEmail,
          privateKey: this.config.privateKey,
        }),
      });
      FcmPushNotificationProvider.messaging = admin.messaging();
    }
  }

  onApplicationBootstrap(): any {
    this.loader.registerProvider(FCM_PUSH_NOTIFICATION_PROVIDER_NAME, this);
  }

  private get messaging() {
    return FcmPushNotificationProvider.messaging;
  }

  private static messaging: admin.messaging.Messaging;

  public async sendMessage(message: IPushNotificationMessage): Promise<IPushNotificationMessageResponse[]> {
    /**
     * Convert generics to provider specific message
     */
    const payload = {
      ...(message.providerOptions ?? {}),
      data: message.data,
      notification: {
        ...(message.providerOptions?.notification ?? {}),
        title: message.notification?.title,
        body: message.notification?.body,
        imageUrl: message.notification?.imageUrl,
      },
    };

    const responses: IPushNotificationMessageResponse[] = [];

    if ('token' in message && Array.isArray(message.token)) {
      const response = await this.messaging.sendEachForMulticast({ ...payload, tokens: message.token });
      for (const i in response.responses) {
        const res = response.responses[i];
        responses.push({
          ...message,
          token: message.token[i],
          response: res.messageId,
          error: res.error,

          // todo
          //invalidToken: res.error?.code === 'messaging/invalid-registration-token',
          invalidToken: false,
        });
      }
    } else {
      const destination = ('topic' in message ? { topic: message.topic } : { token: message.token }) as any;
      try {
        const response = await this.messaging.send({
          ...payload,
          ...destination,
        });
        responses.push({
          ...message,
          ...destination,
          response,
          invalidToken: false,
        });
      } catch (error) {
        responses.push({
          ...message,
          ...destination,
          error,
          // todo
          invalidToken: false,
        });
      }
    }
    return responses;
  }

  public async validate<T extends { token: string }>(data: T): Promise<T & { expiresAt?: Date }> {
    try {
      await this.messaging.send(
        {
          token: data.token,
          data: { validate: 'true' },
        },
        true,
      );

      // token is valid
      return data;
    } catch (error: unknown) {
      throw new BadRequestException('Invalid token', { cause: error });
    }
  }

  /**
   * FCM Specific Subscribe To Topic
   *  - this could be used for mass-messaging, not useful for single targets
   */
  public async subscribeToTopic<T extends IPushNotificationSubscriptionResponse>(
    tokens: T[],
    topic: string,
  ): Promise<T[]> {
    const result = await this.messaging.subscribeToTopic(
      tokens.map((x) => x.token),
      topic,
    );
    return tokens.map((token, i) => {
      token.error = result.errors.find((e) => e.index === i);
      // todo
      token.invalidToken = false;
      return token;
    });
  }

  /**
   * FCM Specific Unsubscribe From Topic
   */
  public async unsubscribeFromTopic<T extends IPushNotificationSubscriptionResponse>(
    tokens: T[],
    topic: string,
  ): Promise<T[]> {
    const result = await this.messaging.unsubscribeFromTopic(
      tokens.map((x) => x.token),
      topic,
    );
    return tokens.map((token, i) => {
      token.error = result.errors.find((e) => e.index === i);
      // todo
      token.invalidToken = false;
      return token;
    });
  }
}
