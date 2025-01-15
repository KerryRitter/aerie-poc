import { z } from 'zod';
import type { Type } from './types';
import { Injectable } from './decorators/injectable.decorator';
import { DbConfigBuilder } from './db/dialects/dialect.factory';

export type DrizzleConfig = {
  schema: string;
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

const configSchema = z.object({
  rootModule: z.any().refine((v): v is Type => typeof v === 'function', {
    message: 'rootModule must be a class constructor',
  }),
  viewGuardRedirect: z.string().optional(),
});

type ConfigSchema = z.infer<typeof configSchema>;

@Injectable()
export class AerieConfig implements ConfigSchema {
  private static instance: AerieConfig;
  rootModule!: Type;
  viewGuardRedirect?: string;
  database: DbConfig;

  constructor() {
    // Initialize with defaults
    this.database = { dialect: 'none', schema: {} };
  }

  static async initialize(
    config: Partial<ConfigSchema>,
    dbConfig?: { schema: any; drizzleConfig?: DrizzleConfig }
  ): Promise<AerieConfig> {
    const validated = configSchema.parse(config);

    if (!this.instance) {
      this.instance = new AerieConfig();
    }

    const database = dbConfig?.drizzleConfig
      ? DbConfigBuilder.buildConfig(dbConfig.drizzleConfig, dbConfig.schema)
      : { dialect: 'none' as const, schema: dbConfig?.schema || {} };

    console.log('Built database config:', database);

    return Object.assign(this.instance, validated, { database });
  }
}
