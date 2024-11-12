import { Inject } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { default as pino, TransportTargetOptions, LoggerOptions } from 'pino';

import { BasicLoggerConfig } from '../basic/basic-logger.config';
import { BasicLoggerService } from '../basic/basic-logger.service';
import { type ILog } from '../interfaces';

let loggerSingleton: (data: ILog) => void;

function getLoggerSingleton(loggerConfig?: { output: string }) {
  if (!loggerSingleton) {
    const targets: TransportTargetOptions[] = [];

    if (loggerConfig?.output === 'console') {
      targets.push({
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      });
    }

    // hook pino-transports

    const pinoConfig: LoggerOptions = {
      errorKey: 'error',
      transport: {
        targets,
      },
    };

    const logger = pino(pinoConfig);

    const levels = {
      fatal: logger.fatal,
      error: logger.error,
      warn: logger.warn,
      log: logger.info,
      debug: logger.debug,
      verbose: logger.trace,
      none: () => undefined,
    };

    loggerSingleton = (data: ILog) => {
      const { level, ...rest } = data;
      levels[level](rest);
    };
  }
  return loggerSingleton;
}

export class PinoLoggerService extends BasicLoggerService {
  constructor(
    @Inject(INQUIRER)
    context: string | object,

    readonly options: BasicLoggerConfig,
  ) {
    super(context, options);
    this._emit = getLoggerSingleton(this.options);
  }
}
