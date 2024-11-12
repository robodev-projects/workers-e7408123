import { type ModuleMetadata } from '@nestjs/common';

import { KVStoreProvider } from '~common/kvstore';

import { MemoryKVStoreProvider } from './memory-kvstore.provider';

/**
 * Local memory key value store
 *  - not for production use, it will not horizontally scale
 */
export const MemoryKVStorePlugin: ModuleMetadata = {
  providers: [{ provide: KVStoreProvider, useClass: MemoryKVStoreProvider }],
};
