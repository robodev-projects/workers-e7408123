import { Response, NextFunction, Request } from 'express';

import { getConfig } from '~common/config';
import { HttpConfig } from '~common/http/http.config';
import { makeId } from '~common/utils/short-uuid';

import type { IHttpRequestLog, IHttpResponseLog } from './interfaces';
import { LoggerService } from './logger.service';
import { type ILoggerStore, loggerStore } from './logger.store';

const httpConfig = getConfig(HttpConfig);

export const httpLogger = new LoggerService('HttpRequest');

/**
 * Global Express Request Handler Middleware
 *  - runs before guards (and thus before everything else)
 *     and just before response (and thus after everything else)
 *  - injects requestId, and traceId
 *  - logs request and response
 */
export function ExpressLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  // Start the request timer
  const requestStart = process.hrtime.bigint();

  if (!request.requestMetadata) {
    request.requestMetadata = {
      requestStart,
    };
  }

  const log: Partial<IHttpResponseLog> = {};

  // Inject requestId
  const spanId = makeId();
  if (httpConfig.spanIdHeader) {
    response.setHeader(httpConfig.spanIdHeader, spanId);
  }
  request.requestMetadata.spanId = spanId;
  log.spanId = spanId;

  // Extract traceId
  if (httpConfig.traceIdHeader && request.get(httpConfig.traceIdHeader)) {
    const traceId = request.get(httpConfig.traceIdHeader);
    request.requestMetadata.traceId = traceId;
    log.traceId = traceId;
  }

  const store: ILoggerStore = {
    ...log,
    remoteIp: request.clientIp,
    requestRoute: `${request.method}:${request.route?.path}`,
    requestUrl: `${request.method}:${request.originalUrl}`,
    userAgent: request.get('User-Agent'),
    requestStart,
    // userId is injected by the auth middleware
  };

  const logData = {
    remoteIp: store.remoteIp,
    requestRoute: store.requestRoute,
    requestUrl: store.requestUrl,
    userAgent: store.userAgent,
  };

  if (httpConfig.log) {
    /**
     * Log the response after it finishes
     */
    response.on('finish', async () => {
      if (request.auth?.ident) store.userId = request.auth?.ident;
      httpLogger.send({
        ...log,
        type: 'http',
        level: 'log',
        code: 'response',
        data: {
          ...logData,
          responseCode: response.statusCode,
          userId: store.userId,
          responseTime: +(Number(process.hrtime.bigint() - requestStart) / 1000000).toFixed(2),
        },
      } satisfies IHttpResponseLog);
    });
  }

  // Inject into logger
  loggerStore.run(
    store,
    httpConfig.log
      ? () => {
          /**
           *  Log the request before it starts
           *    this might show requests that did not finish
           */
          httpLogger.send({
            ...log,
            type: 'http',
            level: 'verbose',
            code: 'request',
            data: logData,
          } satisfies IHttpRequestLog);
          next();
        }
      : next,
  );
}
