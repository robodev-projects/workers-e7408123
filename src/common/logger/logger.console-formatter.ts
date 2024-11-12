/* eslint no-console: 0 */

import { green, blue, red, gray, bold, cyan } from 'chalk';
import { DateTime } from 'luxon';

import type { IHttpResponseLog, ILog } from './interfaces';

const timeFormat = 'yyyy-LL-dd HH:mm:ss.SSS';
export function loggerConsoleFormatter(_log: ILog) {
  let level: string = _log.level ?? 'unknown';
  switch (level) {
    case 'verbose':
    case 'debug':
    case 'trace':
      level = bold(gray(level));
      break;
    case 'log':
      level = bold(level);
      break;
    case 'info':
      level = bold(blue(level));
      break;
    case 'warn':
    case 'error':
    default:
      level = bold(red(level));
      break;
  }
  switch (_log.type) {
    case 'http': {
      const log = _log as IHttpResponseLog;
      let responseCode: string = log.level ?? '-';
      switch (responseCode) {
        case 'verbose':
        case 'debug':
        case 'log':
          if (log.data.responseCode! < 300) {
            responseCode = green(log.data.responseCode!);
          } else {
            responseCode = log.data.responseCode
              ? blue(log.data.responseCode ?? '-')
              : `${log.data.responseCode || '-'}`;
          }
          break;
        default:
          responseCode = red(log.data.responseCode ?? '-');

          break;
      }
      console.log(
        `[${log.timestamp ? DateTime.fromMillis(log.timestamp).toFormat(timeFormat) : '-'}] ` +
          `${log.context} ${level} ` +
          `${log.traceId ? `${log.traceId} ` : ''}` +
          `${log.spanId ? `${log.spanId} ` : ''}` +
          `${log.data.remoteIp ?? '-'} ` +
          `${log.data.userId ?? '-'} ` +
          (log.data.responseCode ? `"${blue(log.data.requestUrl || '')}" ` : `"${log.data.requestUrl || ''}" `) +
          `${responseCode} ` +
          (log.data.responseTime ? `${log.data.responseTime}ms` : '-'),
      );
      break;
    }
    case 'query': {
      const log = _log as ILog;
      let query = log.data?.query ?? '';
      if (log.data?.params && Array.isArray(log.data.params)) {
        try {
          // insert actual values for easy debugging
          const params = log.data.params;
          query = query.replace(/\$[0-9]+/g, (match: string) => {
            const index = parseInt(match.slice(1)) - 1;
            return index in params ? blue(`${params[index]}`) : match;
          });
        } catch (e) {
          query += log.data.params;
        }
      }
      console.log(
        `[${log.timestamp ? DateTime.fromMillis(log.timestamp).toFormat(timeFormat) : '-'}] ` +
          `${log.context} ${level} ` +
          `${log.traceId ? `${log.traceId} ` : ''}` +
          `${log.spanId ? `${log.spanId} ` : ''}` +
          `${log.data?.duration ? `${log.data?.duration}ms ` : '- '}`,
      );
      console.log(cyan(query));
      break;
    }
    default: {
      const log = _log as ILog;
      console.log(
        `[${log.timestamp ? DateTime.fromMillis(log.timestamp).toFormat(timeFormat) : '-'}] ` +
          `${log.context} ${level} ` +
          `${log.traceId ? `${log.traceId} ` : ''}` +
          `${log.spanId ? `${log.spanId} ` : ''}` +
          `${log.code ? green(log.code) + ' ' : ''}` +
          `${log.message ?? ''}`,
      );
      if (log.data) {
        console.log(log.data);
      }
      if (log.error) {
        if ('toConsole' in log.error && typeof log.error.toConsole === 'function') {
          console.log(gray(log.error.toConsole()));
        } else {
          console.log(log.error);
        }
      } else if (log.stack) console.log(log.stack);
    }
  }
}
