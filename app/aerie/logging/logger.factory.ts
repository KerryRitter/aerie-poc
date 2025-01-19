import pino from 'pino';
import type { LoggerConfig } from './logger.config';
import { defaultLoggerConfig } from './logger.config';

export function createLogger(config: LoggerConfig = defaultLoggerConfig) {
  const transport = config.pretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        },
      }
    : {};

  return pino({
    ...config,
    ...transport,
  });
}
