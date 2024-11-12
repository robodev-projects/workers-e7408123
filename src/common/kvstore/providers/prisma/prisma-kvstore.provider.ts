import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { KVStoreProvider } from '~common/kvstore';
import { LoggerService } from '~common/logger';

import { PrismaService } from '~database/prisma';

@Injectable()
export class PrismaKVStoreProvider<GenericValue extends NonNullable<Prisma.JsonValue>>
  implements KVStoreProvider<GenericValue>
{
  private kVStoreItem;

  constructor(
    @Inject('KVStoreNamespace') public readonly namespace: string,
    private readonly logger: LoggerService,
    private readonly prismaService: PrismaService,
  ) {
    this.logger.debug(`Loaded store {${this.namespace}}`);
    this.kVStoreItem = this.prismaService.client.kVStoreItem;
  }

  async set<Value extends GenericValue>(key: string, prefix: string, value: Value, ttl: number): Promise<boolean> {
    await this.kVStoreItem.upsert({
      where: { key_namespace: { key: `${prefix}:${key}`, namespace: this.namespace } },
      create: {
        key: `${prefix}:${key}`,
        value,
        expiresAt: new Date(Date.now() + ttl),
        namespace: this.namespace,
      },
      update: { value, expiresAt: new Date(Date.now() + ttl) },
    });
    return true;
  }

  async has(key: string, prefix: string): Promise<boolean> {
    return !!(await this.kVStoreItem.findUnique({
      where: { key_namespace: { key: `${prefix}:${key}`, namespace: this.namespace } },
    }));
  }

  async get<Value extends GenericValue>(key: string, prefix: string): Promise<Value | null> {
    const item = await this.kVStoreItem.findUnique({
      where: { key_namespace: { key: `${prefix}:${key}`, namespace: this.namespace } },
    });
    if (!item || item.expiresAt < new Date()) return null;
    return item.value as Value;
  }

  async delete(key: string, prefix: string): Promise<boolean> {
    const response = await this.kVStoreItem.delete({
      where: { key_namespace: { key: `${prefix}:${key}`, namespace: this.namespace } },
    });
    return !!response;
  }

  async *list<Value extends GenericValue>(prefix: string): AsyncGenerator<[string, Value]> {
    let cursor: { key: string; namespace: string } | undefined;
    while (true) {
      const items = await this.kVStoreItem.findMany({
        where: {
          key: { startsWith: `${prefix}:` },
          namespace: this.namespace,
        },
        take: 10,
        ...(cursor ? { cursor: { key_namespace: cursor }, skip: 1 } : {}),
      });
      for (const item of items) {
        if (item.expiresAt < new Date()) continue;
        yield [item.key, item.value as Value];
      }
      if (items.length < 10) {
        // last batch
        break;
      }
      cursor = { key: items[items.length - 1]?.key, namespace: this.namespace };
    }
  }

  async clear(prefix: string): Promise<boolean> {
    const response = await this.kVStoreItem.deleteMany({
      where: {
        key: { startsWith: `${prefix}:` },
        namespace: this.namespace,
      },
    });
    return response.count > 0;
  }

  async maintenance(): Promise<void> {
    await this.kVStoreItem.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
  }
}
