import { Injectable } from '../core/decorators/injectable.decorator';
import type { Logger } from 'pino';
import { createLogger } from './logger.factory';
import type { LoggerConfig } from './logger.config';

@Injectable()
export class LoggerService {
  private loggers = new Map<string, Logger>();
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  getLogger(name?: string): Logger {
    if (!name) {
      return this.getRootLogger();
    }

    if (!this.loggers.has(name)) {
      this.loggers.set(
        name,
        createLogger({
          ...this.config,
          name,
        })
      );
    }

    return this.loggers.get(name)!;
  }

  private getRootLogger(): Logger {
    if (!this.loggers.has('root')) {
      this.loggers.set('root', createLogger(this.config));
    }

    return this.loggers.get('root')!;
  }
}
