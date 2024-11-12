import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { api } from '@opentelemetry/sdk-node';

import { getConfig } from '~common/config';

import { LogLevelOrder, BaseLogLevel } from '../base-logger.service';
import { BasicLoggerService } from '../basic/basic-logger.service';
import { type ILog } from '../interfaces';
import { OtelConfig } from './otel.config';

const logger = logs.getLogger('otl-logger');

const otelConfig = getConfig(OtelConfig);
const otelContextLevels = Object.entries(otelConfig.contexts ?? {}).reduce((acc, [context, level]) => {
  if (!LogLevelOrder.includes(level)) {
    return acc;
  }
  acc.set(context, new Set(LogLevelOrder.slice(0, LogLevelOrder.indexOf(level) + 1)));
  return acc;
}, new Map<string, Set<BaseLogLevel>>());
const otelLevels = new Set(LogLevelOrder.slice(0, LogLevelOrder.indexOf(otelConfig.level) + 1));

const otlLevelMap: Record<BaseLogLevel, SeverityNumber> = {
  fatal: SeverityNumber.FATAL,
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  log: SeverityNumber.INFO,
  debug: SeverityNumber.DEBUG,
  verbose: SeverityNumber.TRACE,
  none: SeverityNumber.UNSPECIFIED, // should never be used
};

export class OtelLoggerService extends BasicLoggerService {
  protected _enrich(data: ILog): ILog {
    data = super._enrich(data);
    const activeSpan = api.trace.getSpan(api.context.active());
    const traceId = activeSpan?.spanContext()?.traceId;
    const spanId = activeSpan?.spanContext()?.spanId;

    // todo these are already set in express-logger.middleware.ts
    //  there should be a way to re-use them
    if (traceId) data.traceId = traceId;
    if (spanId) data.spanId = spanId;

    return data;
  }

  protected _process(data: ILog): void {
    const logEnabled = this.isLevelEnabled(data.level, data.context);

    const otelEnabled =
      otelConfig.enabled && data.context && otelContextLevels.has(data.context)
        ? otelContextLevels.get(data.context)!.has(data.level)
        : otelLevels.has(data.level);

    if (!logEnabled && !otelConfig.enabled) {
      return;
    }

    this._enrich(data);
    if (logEnabled) {
      this._emit(data);
    }
    if (otelEnabled) {
      logger.emit({
        body: data.message,
        timestamp: data.timestamp,
        severityNumber: otlLevelMap[data.level],
        attributes: {
          extra: data.data,
          context: data.context,
          code: data.code,
        },
      });
    }
  }
}
