import type { LoggerOptions } from 'pino';

export type LoggerConfig = {
  name?: string;
  level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  pretty?: boolean;
} & Partial<LoggerOptions>;

export const defaultLoggerConfig: LoggerConfig = {
  level: 'info',
  pretty: process.env.NODE_ENV === 'development',
};
