import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, beforeAll, it } from 'vitest';

import { LoggerModule } from '~common/logger';

import { KVStoreModule } from '../../../kvstore.module';
import { KVStoreProvider } from '../../../kvstore.provider.abstract';
import { MemoryKVStorePlugin } from '../../memory';

describe('Memory KVStore', () => {
  let app: INestApplication;
  let kvStoreProvider: KVStoreProvider<{ foo: string }>[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        //
        LoggerModule,
        KVStoreModule.forRoot([MemoryKVStorePlugin]),
        KVStoreModule.forFeature('test'),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    kvStoreProvider = app.get(KVStoreProvider, { each: true });
    await app.init();
  });

  it('should persist the value', async ({ expect }) => {
    const value = { foo: 'bar' };
    await kvStoreProvider[0].set('test', 'test', value, 10000);

    expect(kvStoreProvider[1].namespace).toEqual('test');

    expect(await kvStoreProvider[0].get('test', 'test')).toEqual(value);
    expect(await kvStoreProvider[0].has('test', 'test')).toEqual(true);
    expect(await kvStoreProvider[0].delete('test', 'test')).toEqual(true);
    expect(await kvStoreProvider[1].get('test', 'test')).toEqual(null);

    expect(await kvStoreProvider[0].has('test', 'test')).toEqual(false);
  });
});
