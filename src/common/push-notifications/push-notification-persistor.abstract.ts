import { IPaginatedList } from '~common/http/pagination';

import {
  IPushNotificationToken,
  IPushNotificationTokenCreate,
  IPushNotificationTokenPaginationQuery,
} from './push-notification.types';

export abstract class PushNotificationPersistor {
  public abstract findToken(where: { id: string }): Promise<IPushNotificationToken | null>;

  public abstract listToken(options: {
    where: {
      id?: string | string[];
      resourceName?: string | string[];
      token?: string | string[];
      provider?: string | string[];
      expiresAt__gt?: Date;
    };
    skip?: number;
    take?: number;
  }): Promise<IPushNotificationToken[]>;

  public abstract paginateToken(
    query: IPushNotificationTokenPaginationQuery & { filter: { resourceName?: string } },
  ): Promise<IPaginatedList<IPushNotificationToken>>;

  public abstract createToken(data: IPushNotificationTokenCreate): Promise<IPushNotificationToken>;

  public abstract updateToken(
    where: { id: string },
    data: Partial<IPushNotificationToken>,
  ): Promise<IPushNotificationToken>;

  public abstract deleteToken(where: {
    id?: string | string[];
    token?: string | string[];
    resourceName?: string | string[];
    expiresAt__lt?: Date;
  }): Promise<number>;
}
