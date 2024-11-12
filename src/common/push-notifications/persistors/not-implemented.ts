import { type ModuleMetadata } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import { IPaginatedList } from '~common/http/pagination';

import { PushNotificationPersistor } from '../push-notification-persistor.abstract';
import type { IPushNotificationToken } from '../push-notification.types';

@Injectable()
export class NotImplementedPushNotificationPersistor implements PushNotificationPersistor {
  public async findToken(): Promise<IPushNotificationToken> {
    throw new Error('Method not implemented');
  }

  public async listToken(): Promise<IPushNotificationToken[]> {
    throw new Error('Method not implemented');
  }

  public async paginateToken(): Promise<IPaginatedList<IPushNotificationToken>> {
    throw new Error('Method not implemented');
  }

  public async createToken(): Promise<IPushNotificationToken> {
    throw new Error('Method not implemented');
  }

  public async updateToken(): Promise<IPushNotificationToken> {
    throw new Error('Method not implemented');
  }

  public async deleteToken(): Promise<number> {
    throw new Error('Method not implemented');
  }
}

export const NotImplementedPushNotificationPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: PushNotificationPersistor, useClass: NotImplementedPushNotificationPersistor }],
};
