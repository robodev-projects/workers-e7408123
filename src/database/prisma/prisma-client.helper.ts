import { Prisma, PrismaClient } from '@prisma/client';

import { BaseLogLevel, LoggerService } from '~common/logger';

import { type PrismaConfig } from './prisma.config';

type IPrismaClient = PrismaClient<Prisma.PrismaClientOptions, 'info' | 'query' | 'warn' | 'error'>;

export function getPrismaClient(prismaConfig: PrismaConfig, logger?: LoggerService): IPrismaClient {
  const client: IPrismaClient = new PrismaClient({
    /**
     * Trust the database connection string from schema.prisma
     *  Defaults to DATABASE_URL, and it set at `prisma:bootstrap`
     *  and it should equal to `prismaConfig.databaseUrl`
     */
    datasourceUrl: prismaConfig.databaseUrl,

    /**
     * Log Prisma Client queries as events to the logger
     */
    log: prismaConfig.log?.map((level) => ({ emit: 'event', level })),

    transactionOptions: {
      //maxWait: 2000,
      //timeout: 5000,
      /**
       * The isolation level of the transaction, Serializable is most strict
       *  @see https://www.prisma.io/docs/orm/prisma-client/queries/transactions#transaction-isolation-level
       */
      isolationLevel: 'Serializable',
    },
  });

  /**
   * enhancement: add runtime logs of events linked to requests
   *    $extends(
   *       Prisma.defineExtension({
   *         query: {
   *           $allOperations(params) {
   *             console.log(loggerStore.getStore());
   *             return;
   *           },
   *         },
   *       }),
   *     );
   */

  if (logger) {
    for (const [a, b] of [
      ['info', 'debug'],
      ['warn', 'warn'],
      ['error', 'error'],
    ] as [Prisma.LogLevel, BaseLogLevel & keyof LoggerService][]) {
      if (prismaConfig.log?.includes(a) && logger.isLevelEnabled(b)) {
        client.$on(a, (event) => {
          if ('message' in event) {
            const { message, ...rest } = event;
            logger.send({ message, level: b, data: rest });
          } else {
            logger.send({
              context: 'PrismaQuery',
              data: event,
              type: 'query',
              level: b,
            });
          }
        });
      }
    }

    if (prismaConfig.log?.includes('query') && logger.isLevelEnabled('debug')) {
      client.$on('query', (event) => {
        const params = event.params.replace(/(^\[)|(]$)/g, '').split(',');
        logger.send({
          context: 'PrismaQuery',
          data: { ...event, params },
          type: 'query',
          message: 'Query',
          level: 'debug',
        });
      });
    }
  }
  return client;
}
