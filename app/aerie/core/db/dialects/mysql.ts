import { Injectable } from '../../decorators/injectable.decorator';
import { ServerOnly } from '../../environment/decorators';
import { DbDialect } from './dialect.interface';
import { Kysely, MysqlDialect } from 'kysely';
import type { AerieConfig } from '../../aerie-config';

export type MySqlDb<TSchema extends Record<string, unknown>> = any;

@Injectable()
@ServerOnly()
export class MySqlDbDialect<TSchema extends Record<string, unknown>>
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
      throw new Error('Missing required MySQL configuration');
    }

    try {
      const [mysql, { drizzle }] = await Promise.all([
        import('mysql2/promise').catch(() => {
          throw new Error(
            'Failed to load mysql2. Make sure it is installed: npm install mysql2'
          );
        }),
        import('drizzle-orm/mysql2'),
      ]);

      const pool = mysql.createPool({
        uri: config.url,
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
      });

      const orm = drizzle(pool, {
        schema: config.schema,
        mode: 'default',
      });

      const qb = new Kysely<TSchema>({
        dialect: new MysqlDialect({
          pool,
        }),
      });

      return { orm, qb };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to initialize MySQL: ${message}`);
    }
  }
}
