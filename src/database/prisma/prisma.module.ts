import { Global, Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { PrismaSingletonService } from './prisma-singleton.service';
import { PrismaConfig } from './prisma.config';
import { PrismaService } from './prisma.service.abstract';

@Global()
@Module({
  providers: [{ provide: PrismaService, useClass: PrismaSingletonService }, getConfigFactory(PrismaConfig)],
  exports: [PrismaService],
})
export class PrismaModule {}
