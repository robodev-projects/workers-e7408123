import { type ModuleMetadata } from '@nestjs/common';

import { KVStoreProvider } from '../../kvstore.provider.abstract';
import { PrismaKVStoreProvider } from './prisma-kvstore.provider';

/**
 * Prisma KVStore
 *  - Provides a simple KVStore implementation using Postgres
 */
export const PrismaKVStorePlugin: ModuleMetadata = {
  providers: [{ provide: KVStoreProvider, useClass: PrismaKVStoreProvider }],
};
