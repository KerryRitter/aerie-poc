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
    if (config.dialect !== 'mysql') {
      throw new Error('Invalid dialect type for MySQL');
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

  static fromDrizzleConfig(
    drizzleConfig: {
      driver: string;
      dbCredentials: {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        database?: string;
      };
    },
    schema: any
  ): AerieConfig['database'] {
    if (drizzleConfig.driver !== 'mysql2') {
      throw new Error('Invalid driver type for MySQL');
    }

    if (
      !drizzleConfig.dbCredentials.host ||
      !drizzleConfig.dbCredentials.user ||
      !drizzleConfig.dbCredentials.password ||
      !drizzleConfig.dbCredentials.database
    ) {
      throw new Error('Missing required MySQL credentials');
    }

    return {
      dialect: 'mysql',
      host: drizzleConfig.dbCredentials.host,
      port: drizzleConfig.dbCredentials.port || 3306,
      user: drizzleConfig.dbCredentials.user,
      password: drizzleConfig.dbCredentials.password,
      database: drizzleConfig.dbCredentials.database,
      schema,
    };
  }
}
