import 'reflect-metadata';

// hook: instrumentation

import { NestFactory } from '@nestjs/core';

import { getConfig } from '~common/config';
import { HttpConfig } from '~common/http/http.config';
import { LoggerService } from '~common/logger';

import { AppModule } from '~app.module';
import { requestPipes } from '~app.pipes';

const logger = new LoggerService('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  /**
   * Enable onApplicationShutdown lifecycle hook for graceful shutdown
   * @see https://docs.nestjs.com/fundamentals/lifecycle-events
   */
  app.enableShutdownHooks();

  /**
   * Load global pipes for
   *  - logging, metrics
   *  - error handling
   */
  requestPipes(app);

  const httpConfig = getConfig(HttpConfig);
  await app.listen(httpConfig.port, httpConfig.host);
}
bootstrap().catch((e) => {
  logger.error(e);
  throw e;
});
