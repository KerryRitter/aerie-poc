import { z } from 'zod';
import type { Type } from './types';
import { Injectable } from './decorators/injectable.decorator';
import { DbConfigBuilder } from '../db/dialects/dialect.factory';
import type { LoggerConfig } from '@aerie/logging';
import { defaultLoggerConfig } from '@aerie/logging';

export type DrizzleConfig = {
  schema: any;
  drizzleConfig?: {
    out: string;
    driver: 'pg' | 'mysql2' | 'better-sqlite';
    dbCredentials: {
      url?: string;
      connectionString?: string;
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      database?: string;
    };
  };
};

export type SqliteDbConfig = {
  dialect: 'sqlite';
  file: string;
  schema: any;
};

export type PostgresDbConfig = {
  dialect: 'postgres';
  connectionString: string;
  schema: any;
};

export type MySqlDbConfig = {
  dialect: 'mysql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  schema: any;
};

export type DbConfig =
  | SqliteDbConfig
  | PostgresDbConfig
  | MySqlDbConfig
  | { dialect: 'none'; schema: any };

export type AerieConfigOptions = {
  viewGuardRedirect?: string;
  database?: DrizzleConfig;
  logger?: LoggerConfig;
};

const configSchema = z.object({
  rootModule: z.any().refine(
    (v) => {
      // Check if it's a class constructor
      if (typeof v === 'function') {
        return true;
      }
      // Check if it's a dynamic module
      if (
        typeof v === 'object' &&
        v !== null &&
        'module' in v &&
        typeof v.module === 'function'
      ) {
        return true;
      }
      return false;
    },
    {
      message: 'rootModule must be a class constructor or a dynamic module',
    }
  ),
  viewGuardRedirect: z.string().optional(),
  logger: z.any().optional(),
});

type ConfigSchema = z.infer<typeof configSchema>;

export type AerieConfigConstructionParams = Partial<ConfigSchema> & {
  database?: DrizzleConfig;
};

@Injectable()
export class AerieConfig implements ConfigSchema {
  private static instance: AerieConfig;
  rootModule!: Type;
  viewGuardRedirect?: string;
  database: DbConfig;
  logger?: LoggerConfig;

  constructor() {
    // Initialize with defaults
    this.database = { dialect: 'none', schema: {} };
    this.logger = defaultLoggerConfig;
  }

  static async initialize(
    config: AerieConfigConstructionParams
  ): Promise<AerieConfig> {
    const validated = configSchema.parse(config);

    if (!this.instance) {
      this.instance = new AerieConfig();
    }

    const database = config.database
      ? DbConfigBuilder.buildConfig(
          config.database.drizzleConfig,
          config.database.schema
        )
      : { dialect: 'none' as const, schema: {} };

    return Object.assign(this.instance, validated, { database });
  }
}
