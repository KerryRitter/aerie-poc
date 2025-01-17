import type { AerieConfig } from '@aerie/core/aerie-config';
import { Dependencies, Injectable } from '@aerie/core/decorators';
import { ServerOnly } from '@aerie/core/environment/decorators';
import { MySqlDbDialect, PostgresDbDialect, SqliteDbDialect } from '.';
import type { DbDialect } from './dialect.interface';

type Dialect = 'none' | 'postgres' | 'mysql' | 'sqlite';
type DrizzleConfig = {
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

// Separate utility class for config building
export class DbConfigBuilder {
  static buildConfig(
    drizzleConfig: DrizzleConfig | undefined,
    schema: any
  ): AerieConfig['database'] {
    if (!drizzleConfig) {
      return { dialect: 'none', schema };
    }

    try {
      switch (drizzleConfig.driver) {
        case 'better-sqlite':
          return SqliteDbDialect.fromDrizzleConfig(drizzleConfig, schema);
        case 'pg':
          return PostgresDbDialect.fromDrizzleConfig(drizzleConfig, schema);
        case 'mysql2':
          return MySqlDbDialect.fromDrizzleConfig(drizzleConfig, schema);
        default:
          throw new Error(
            `Unsupported database driver: ${drizzleConfig.driver}`
          );
      }
    } catch (err) {
      console.warn('Failed to configure database:', err);
      return { dialect: 'none', schema };
    }
  }
}

@Injectable()
@Dependencies(PostgresDbDialect, MySqlDbDialect, SqliteDbDialect)
@ServerOnly()
export class DbDialectFactory {
  constructor(
    private readonly postgresDialect: PostgresDbDialect<any>,
    private readonly mysqlDialect: MySqlDbDialect<any>,
    private readonly sqliteDialect: SqliteDbDialect<any>
  ) {}

  get<TSchema extends Record<string, unknown>>(
    dialect: Dialect
  ): DbDialect<TSchema> | null {
    switch (dialect) {
      case 'postgres':
        return this.postgresDialect as DbDialect<TSchema>;
      case 'mysql':
        return this.mysqlDialect as DbDialect<TSchema>;
      case 'sqlite':
        return this.sqliteDialect as DbDialect<TSchema>;
      case 'none':
        return null;
      default:
        throw new Error(`Unsupported dialect: ${dialect}`);
    }
  }
}
