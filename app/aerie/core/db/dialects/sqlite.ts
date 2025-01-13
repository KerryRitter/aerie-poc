import { Kysely, SqliteDialect } from 'kysely';
import type { AerieConfig } from '../../aerie-config';
import { Injectable } from '../../decorators/injectable.decorator';
import { ServerOnly } from '../../environment/decorators';
import type { DbDialect } from './dialect.interface';

export type SqliteDb<TSchema extends Record<string, unknown>> = any;

@Injectable()
@ServerOnly()
export class SqliteDbDialect<TSchema extends Record<string, unknown>>
  implements DbDialect<TSchema>
{
  async initialize(config: AerieConfig['database']) {
    if (!config.file) {
      throw new Error('SQLite file path is required');
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
}
