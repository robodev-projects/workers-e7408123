import { Injectable } from '@nestjs/common';
import { Prisma, PushNotificationToken } from '@prisma/client';

import { IPaginatedList } from '~common/http/pagination';
import { makeUUID } from '~common/utils/short-uuid';

import { generatePaginationOrderByPrisma, PrismaService } from '~database/prisma';

import { PushNotificationPersistor } from '../../push-notification-persistor.abstract';
import {
  IPushNotificationToken,
  IPushNotificationTokenCreate,
  IPushNotificationTokenPaginationQuery,
} from '../../push-notification.types';

@Injectable()
export class PrismaPushNotificationPersistor implements PushNotificationPersistor {
  constructor(private readonly prismaService: PrismaService) {}

  private toIPushNotificationToken(token: PushNotificationToken): IPushNotificationToken {
    return {
      id: token.id,
      token: token.token,
      resourceName: token.resourceName,
      title: token.title || undefined,
      provider: token.provider,
      expiresAt: token.expiresAt || undefined,
      createdAt: token.createdAt,
    };
  }

  public async findToken(where: { id: string }): Promise<IPushNotificationToken | null> {
    const item = await this.prismaService.client.pushNotificationToken.findUnique({
      where: { id: where.id },
    });
    return item ? this.toIPushNotificationToken(item) : null;
  }

  public async listToken(options: {
    where: {
      id?: string | string[];
      resourceName?: string | string[];
      token?: string | string[];
      provider?: string | string[];
      expiresAt__gt?: Date;
    };
    skip?: number;
    take?: number;
  }): Promise<IPushNotificationToken[]> {
    const where: Record<string, any> = {};
    for (const [key, value] of Object.entries(options.where)) {
      switch (key) {
        case 'id':
        case 'resourceName':
        case 'token':
        case 'provider':
          where[key] = Array.isArray(value) ? { in: value } : value;
          break;
        case 'expiresAt__gt':
          where.expiresAt = { gt: value };
          break;
        default:
          throw new Error('Invalid where parameter');
      }
    }
    return this.prismaService.client.pushNotificationToken
      .findMany({
        where,
        skip: options.skip ?? 0,
        take: options.take ?? 10,
      })
      .then((items) => items.map(this.toIPushNotificationToken));
  }

  public async paginateToken(
    query: IPushNotificationTokenPaginationQuery & { filter: { resourceName?: string } },
  ): Promise<IPaginatedList<IPushNotificationToken>> {
    const { page, limit } = query;
    const where: Prisma.PushNotificationTokenWhereInput = {};

    if (query.filter) {
      for (const key of Object.keys(query.filter)) {
        switch (key) {
          case 'resource':
            where.resourceName = query.filter.resourceName;
            break;
          case 'provider':
            where.provider = query.filter.provider;
            break;
        }
      }
    }

    const orderBy = generatePaginationOrderByPrisma(query.order);
    const offset = (page - 1) * limit;
    const items = await this.prismaService.client.pushNotificationToken.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy,
    });
    const count = await this.prismaService.client.pushNotificationToken.count({ where });

    return {
      items: items.map(this.toIPushNotificationToken),
      page,
      limit,
      totalItems: count,
    };
  }

  public async createToken(data: IPushNotificationTokenCreate): Promise<IPushNotificationToken> {
    return this.toIPushNotificationToken(
      await this.prismaService.client.pushNotificationToken.create({ data: { ...data, id: data.id ?? makeUUID() } }),
    );
  }

  public async updateToken(
    where: { id: string },
    data: Partial<IPushNotificationToken>,
  ): Promise<IPushNotificationToken> {
    if (!('id' in where) || !where.id) {
      throw new Error('Either id or key must be provided');
    }
    return this.toIPushNotificationToken(
      await this.prismaService.client.pushNotificationToken.update({
        where: { id: where.id },
        data,
      }),
    );
  }

  public async deleteToken(where: {
    id?: string | string[];
    token?: string | string[];
    resourceName?: string | string[];
    expiresAt__lt?: Date;
  }): Promise<number> {
    const deleteWhere: Prisma.PushNotificationTokenWhereInput = {};
    for (const [key, value] of Object.entries(where)) {
      switch (key) {
        case 'id':
        case 'token':
        case 'resourceName':
          deleteWhere[key] = Array.isArray(value) ? { in: value } : (value as string);
          break;
        case 'expiresAt__lt':
          deleteWhere.expiresAt = { lt: value as Date };
          break;
        default:
          throw new Error('Invalid where parameter');
      }
    }
    const deleted = await this.prismaService.client.pushNotificationToken.deleteMany({ where: deleteWhere });

    // all good
    return deleted.count;
  }
}
