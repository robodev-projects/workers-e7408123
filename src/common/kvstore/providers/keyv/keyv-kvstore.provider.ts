import { Inject, Injectable } from '@nestjs/common';
import { Keyv, KeyvOptions, KeyvStoreAdapter } from 'keyv';

import { LoggerService } from '~common/logger';

import { KVStoreProvider } from '../../kvstore.provider.abstract';

@Injectable()
export class KeyvKVStoreProvider<GenericValue> implements KVStoreProvider<GenericValue> {
  private keyv: Keyv<GenericValue>;

  constructor(
    @Inject('KeyvKVStoreOptions') private readonly options: KeyvStoreAdapter | KeyvOptions,
    @Inject('KVStoreNamespace') public readonly namespace: string,
    private readonly logger: LoggerService,
  ) {
    this.keyv = new Keyv(this.options);
    this.logger.debug(`Loaded store {${this.namespace}}`);
  }

  async set<Value extends GenericValue>(key: string, prefix: string, value: Value, ttl: number): Promise<boolean> {
    return this.keyv.set(`${prefix}:${key}`, value, ttl);
  }

  async has(key: string, prefix: string): Promise<boolean> {
    return await this.keyv.has(`${prefix}:${key}`);
  }

  async get<Value extends GenericValue>(key: string, prefix: string): Promise<Value | null> {
    return (await this.keyv.get(`${prefix}:${key}`)) ?? null;
  }

  async delete(key: string, prefix: string): Promise<boolean> {
    return this.keyv.delete(`${prefix}:${key}`);
  }

  async *list<Value extends GenericValue>(prefix: string): AsyncGenerator<[string, Value]> {
    if (!this.keyv.iterator) {
      throw new Error('Iterator not supported');
    }
    for await (const [key, value] of this.keyv.iterator({})) {
      // todo https://github.com/jaredwray/keyv/issues/1181
      if (key.startsWith(prefix)) yield [key, value];
    }
  }

  async clear(prefix: string): Promise<boolean> {
    // todo keyv.clear({ prefix: prefix });

    for await (const [key] of this.list(prefix)) {
      await this.keyv.delete(key);
    }
    return true;
  }
}
