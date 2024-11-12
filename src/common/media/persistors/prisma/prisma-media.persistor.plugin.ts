import { type ModuleMetadata } from '@nestjs/common';

import { MediaPersistor } from '../../media-persistor.abstract';
import { PrismaMediaPersistor } from './prisma-media.persistor';

/**
 * Store media meta data using Prisma
 */
export const PrismaMediaPersistorPlugin: ModuleMetadata = {
  providers: [{ provide: MediaPersistor, useClass: PrismaMediaPersistor }],
};
