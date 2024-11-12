import type { IPushNotificationMessage, IPushNotificationMessageResponse } from './push-notification.types';

export abstract class PushNotificationProvider {
  public abstract sendMessage(message: IPushNotificationMessage): Promise<IPushNotificationMessageResponse[]>;
  public abstract validate<T extends { token: string }>(data: T): Promise<T & { expiresAt?: Date }>;
}
