import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { LoggerService } from '~common/logger';

import { getPrismaClient } from './prisma-client.helper';
import { PrismaConfig } from './prisma.config';

@Injectable()
export class PrismaSingletonService implements OnModuleInit {
  public client: PrismaClient;

  private static singleton: PrismaClient | null = null;

  constructor(
    private readonly config: PrismaConfig,
    private readonly logger: LoggerService,
  ) {
    /*
      Invocations of the prisma CLI and general usage of Studio results in data being sent to the telemetry server at https://checkpoint.prisma.io.
      Setting the CHECKPOINT_DISABLE environment variable to 1 prevents this.
    */
    process.env.CHECKPOINT_DISABLE = '1';

    if (!PrismaSingletonService.singleton) {
      /**
       * Prevent multiple instances of PrismaClient
       *  @see https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
       */
      PrismaSingletonService.singleton = getPrismaClient(config, this.logger);
    }

    this.client = PrismaSingletonService.singleton!;
  }

  async onModuleInit() {
    /**
     * Prisma connects to the database when the first query is executed,
     *  but we want to fail fast if the credentials are incorrect
     * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management#connect
     */
    if (this.config.autoConnect) {
      await this.client.$connect();
    }
  }

  /**
   * Controlled shutdown
   *  Prisma will automatically disconnect on SIGINT, you do not have to call `$disconnect`.
   *  After the call, Prisma will attempt to wait for all queries to finish before terminating.
   *
   *  prisma.$on('beforeExit', async () => runShutdownHooks());
   *  public shutdownHooks: Record<string, () => Promise<void>> = {};
   *  private runShutdownHooks = async () => {
   *    await Promise.all(Object.values(this.shutdownHooks).map((hook) => hook()));
   *  };
   *
   *  Awaiting the disconnect might put the process in a deadlock if there are still queries running.
   *
   *  @see https://docs.nestjs.com/fundamentals/lifecycle-events
   */
  async disconnect() {
    await this.client.$disconnect();
    PrismaSingletonService.singleton = null;
  }
}
