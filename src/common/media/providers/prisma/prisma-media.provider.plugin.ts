import { type ModuleMetadata } from '@nestjs/common';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { getConfigFactory } from '~common/config';

import { PrismaMediaProvider } from './prisma-media.provider';
import { PrismaMediaProviderConfig } from './prisma-media.provider.config';
import { PrismaMediaProviderController } from './prisma-media.provider.controller';

/**
 * Module for Prisma media provider
 *  stores media in the database, probably not a production ready solution
 */
export const PrismaMediaProviderPlugin: ModuleMetadata = {
  imports: [NestjsFormDataModule],
  providers: [getConfigFactory(PrismaMediaProviderConfig), PrismaMediaProvider],
  controllers: [PrismaMediaProviderController],
};
