import type { AerieConfig } from '@aerie/core/aerie-config';
import { Injectable } from '@aerie/core/decorators';
import { ServerOnly } from '@aerie/core/environment/decorators';
import { Kysely, SqliteDialect } from 'kysely';
import type { DbDialect } from './dialect.interface';

export type SqliteDb<TSchema extends Record<string, unknown>> = any;

@Injectable()
@ServerOnly()
export class SqliteDbDialect<TSchema extends Record<string, unknown>>
  implements DbDialect<TSchema>
{
  async initialize(config: AerieConfig['database']) {
    if (config.dialect !== 'sqlite') {
      throw new Error('Invalid dialect type for SQLite');
    }

    try {
      const sqlite = await import('better-sqlite3');
      const { drizzle } = await import('drizzle-orm/better-sqlite3');

      // Create the database connection
      const db = new sqlite.default(config.file);
      const orm = drizzle(db, { schema: config.schema });

      // Create the query builder
      const qb = new Kysely<TSchema>({
        dialect: new SqliteDialect({
          database: db,
        }),
      });

      return { orm, qb };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to initialize SQLite: ${message}`);
    }
  }

  static fromDrizzleConfig(
    drizzleConfig: {
      driver: string;
      dbCredentials: {
        url?: string;
      };
    },
    schema: any
  ): AerieConfig['database'] {
    if (drizzleConfig.driver !== 'better-sqlite') {
      throw new Error('Invalid driver type for SQLite');
    }

    if (!drizzleConfig.dbCredentials.url) {
      throw new Error('Missing required SQLite file path');
    }

    return {
      dialect: 'sqlite',
      file: drizzleConfig.dbCredentials.url,
      schema,
    };
  }
}
