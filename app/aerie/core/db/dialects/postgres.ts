import { Injectable } from '../../decorators/injectable.decorator';
import { ServerOnly } from '../../environment/decorators';
import { DbDialect } from './dialect.interface';
import { Kysely, PostgresDialect } from 'kysely';
import type { AerieConfig } from '../../aerie-config';

export type PostgresDb<TSchema extends Record<string, unknown>> = any;

@Injectable()
@ServerOnly()
export class PostgresDbDialect<TSchema extends Record<string, unknown>>
  implements DbDialect<TSchema>
{
  async initialize(config: AerieConfig['database']) {
    if (
      !config.url &&
      (!config.host ||
        !config.port ||
        !config.user ||
        !config.password ||
        !config.database)
    ) {
      throw new Error('Missing required PostgreSQL configuration');
    }

    try {
      const [{ Pool }, { drizzle }] = await Promise.all([
        import('pg'),
        import('drizzle-orm/node-postgres'),
      ]);

      const pool = new Pool({
        connectionString: config.url,
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      });

      const orm = drizzle(pool, { schema: config.schema });
      const qb = new Kysely<TSchema>({
        dialect: new PostgresDialect({ pool }),
      });

      return { orm, qb };
    } catch (err) {
      throw new Error(
        'Failed to load PostgreSQL dependencies. Make sure they are installed: npm install pg'
      );
    }
  }
}
