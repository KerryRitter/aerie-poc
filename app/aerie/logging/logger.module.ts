import type { DynamicModule, FactoryProvider } from '@aerie/core';
import { Module } from '@aerie/core';
import type { LoggerConfig } from './logger.config';
import { defaultLoggerConfig } from './logger.config';
import { LoggerService } from './logger.service';

export type LoggerModuleAsyncOptions = {
  useFactory: (...args: any[]) => Promise<LoggerConfig> | LoggerConfig;
  inject?: any[];
};

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {
  static forRoot(config: LoggerConfig = defaultLoggerConfig): DynamicModule {
    const loggerProvider: FactoryProvider<LoggerService> = {
      provide: LoggerService,
      useFactory: () => new LoggerService(config),
    };

    return {
      module: LoggerModule,
      providers: [loggerProvider],
    };
  }

  forRoot(config: LoggerConfig = defaultLoggerConfig): DynamicModule {
    const loggerProvider: FactoryProvider<LoggerService> = {
      provide: LoggerService,
      useFactory: () => new LoggerService(config),
    };

    return {
      module: LoggerModule,
      providers: [loggerProvider],
    };
  }

  static async forRootAsync(
    options: LoggerModuleAsyncOptions
  ): Promise<DynamicModule> {
    const loggerProvider: FactoryProvider<LoggerService> = {
      provide: LoggerService,
      useFactory: async (...deps: any[]) => {
        const config = await options.useFactory(...deps);
        return new LoggerService(config);
      },
      inject: options.inject,
    };

    return {
      module: LoggerModule,
      providers: [loggerProvider],
    };
  }

  async forRootAsync(
    options: LoggerModuleAsyncOptions
  ): Promise<DynamicModule> {
    const loggerProvider: FactoryProvider<LoggerService> = {
      provide: LoggerService,
      useFactory: async (...deps: any[]) => {
        const config = await options.useFactory(...deps);
        return new LoggerService(config);
      },
      inject: options.inject,
    };

    return {
      module: LoggerModule,
      providers: [loggerProvider],
    };
  }
}
