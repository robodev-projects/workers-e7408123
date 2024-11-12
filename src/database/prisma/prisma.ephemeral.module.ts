import { Global, Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { PrismaEphemeralService } from './prisma-ephemeral.service';
import { PrismaConfig } from './prisma.config';
import { PrismaService } from './prisma.service.abstract';

@Global()
@Module({
  providers: [
    { provide: PrismaService, useClass: PrismaEphemeralService },
    PrismaEphemeralService,
    getConfigFactory(PrismaConfig),
  ],
  exports: [PrismaService, PrismaEphemeralService],
})
export class PrismaEphemeralModule {}
