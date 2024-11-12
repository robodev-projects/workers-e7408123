import { type ModuleMetadata } from '@nestjs/common';
import { KeyvOptions, KeyvStoreAdapter } from 'keyv';

import { KVStoreProvider } from '~common/kvstore';

import { KeyvKVStoreProvider } from './keyv-kvstore.provider';

/**
 * Keyv Key-Value Store Provider
 *  - can use multiple backends, check docs for configuration
 *  - production ready
 */
export const KeyvKVStorePlugin = {
  register: (options?: KeyvStoreAdapter | KeyvOptions) =>
    ({
      providers: [
        { provide: KVStoreProvider, useClass: KeyvKVStoreProvider },
        { provide: 'KeyvKVStoreOptions', useValue: options },
      ],
    }) satisfies ModuleMetadata,
};
