import { Inject, Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';

import { KVStoreProvider } from '../../kvstore.provider.abstract';

@Injectable()
export class MemoryKVStoreProvider<GenericValue> implements KVStoreProvider<GenericValue> {
  private map: Map<string, { value: GenericValue; expiresAt: Date }>;

  constructor(
    @Inject('KVStoreNamespace') public readonly namespace: string,
    private readonly logger: LoggerService,
  ) {
    this.map = new Map();
    this.logger.debug(`Loaded store {${this.namespace}}`);
  }

  async set<Value extends GenericValue>(key: string, prefix: string, value: Value, ttl: number): Promise<boolean> {
    this.map.set(`${prefix}:${key}`, { value, expiresAt: new Date(Date.now() + ttl) });
    return true;
  }

  async has(key: string, prefix: string): Promise<boolean> {
    return !!(await this.get(key, prefix));
  }

  async get<Value extends GenericValue>(key: string, prefix: string): Promise<Value | null> {
    const item = this.map.get(`${prefix}:${key}`);
    return item && item.expiresAt > new Date() ? (item.value as Value) : null;
  }

  async delete(key: string, prefix: string): Promise<boolean> {
    return this.map.delete(`${prefix}:${key}`);
  }

  async *list<Value extends GenericValue>(prefix: string): AsyncGenerator<[string, Value]> {
    for await (const [key, value] of this.map.entries()) {
      // todo https://github.com/jaredwray/keyv/issues/1181
      if (key.startsWith(prefix) && value.expiresAt > new Date()) yield [key, value.value as Value];
    }
  }

  async clear(prefix: string): Promise<boolean> {
    // todo keyv.clear({ prefix: prefix });

    let items = 0;
    for await (const [key] of this.list(prefix)) {
      this.map.delete(key);
      items++;
    }
    return items > 0;
  }
}
