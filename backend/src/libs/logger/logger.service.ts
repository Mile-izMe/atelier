import { Inject, Injectable, LoggerService } from '@nestjs/common';
import winston from 'winston';
import { LogLevel } from '#app/libs/logger/enums/logger.enum';
import { type LoggerOptions } from '#app/libs/logger/interface/logger.interface';
import { LOGGER_OPTIONS } from './logger.module-definition.js';
import { inspect } from 'node:util';
import { getTraceId } from '../request-context/request-context.js';

@Injectable()
export class CustomLogger implements LoggerService {
  private readonly winstonLogger: winston.Logger;

  constructor(
    @Inject(LOGGER_OPTIONS) private readonly _options: LoggerOptions,
  ) {
    const winstonLevel = this._options.logLevel;

    // the smaller the number, the more serious the problem
    // all logs below the setup level is logged
    const WINSTON_LEVELS = {
      [LogLevel.FATAL]: 0,
      [LogLevel.ERROR]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.INFO]: 3,
      [LogLevel.DEBUG]: 4,
      [LogLevel.VERBOSE]: 5,
    };

    winston.addColors({
      fatal: 'bold red',
      error: 'red',
      warn: 'yellow',
      info: 'green',
      debug: 'cyan',
      verbose: 'gray',
    });

    this.winstonLogger = winston.createLogger({
      levels: WINSTON_LEVELS,
      level: winstonLevel,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(), // auto add timestamp
        winston.format.simple(),
        // winston.format.json(), // Turn output into JSON (prod)
      ),
      // Auto attach prefix to all logs
      defaultMeta: { service: this._options.prefix || 'Atelier' },
      transports: [new winston.transports.Console()],
    });
  }

  private write(
    level: LogLevel,
    input: unknown,
    context?: string,
    stack?: string,
  ) {
    const message =
      input instanceof Error
        ? input.message
        : typeof input === 'string'
          ? input
          : inspect(input, { depth: 4 });

    this.winstonLogger.log({
      level,
      message,
      context,
      traceId: getTraceId(),
      stack: stack ?? (input instanceof Error ? input.stack : undefined),
    });
  }

  /**
   * Write a 'log' level log.
   */
  log(message: unknown, context?: string) {
    this.write(LogLevel.INFO, message, context);
  }

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: unknown, context?: string) {
    this.write(LogLevel.FATAL, message, context);
  }

  /**
   * Write an 'error' level log.
   */
  error(message: unknown, stack?: string, context?: string) {
    this.write(LogLevel.ERROR, message, context, stack);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: unknown, context?: string) {
    this.write(LogLevel.WARN, message, context);
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: unknown, context?: string) {
    this.write(LogLevel.DEBUG, message, context);
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: unknown, context?: string) {
    this.write(LogLevel.VERBOSE, message, context);
  }
}
