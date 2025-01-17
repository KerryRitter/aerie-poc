import { Injectable } from '@aerie/core/decorators';
import { ServerOnly } from '@aerie/core/environment/decorators';
import { DbDialect } from './dialect.interface';
import { Kysely, PostgresDialect } from 'kysely';
import type { AerieConfig } from '@aerie/core/aerie-config';

export type PostgresDb<TSchema extends Record<string, unknown>> = any;

@Injectable()
@ServerOnly()
export class PostgresDbDialect<TSchema extends Record<string, unknown>>
  implements DbDialect<TSchema>
{
  async initialize(config: AerieConfig['database']) {
    if (config.dialect !== 'postgres') {
      throw new Error('Invalid dialect type for PostgreSQL');
    }

    try {
      const [{ Pool }, { drizzle }] = await Promise.all([
        import('pg'),
        import('drizzle-orm/node-postgres'),
      ]);

      const pool = new Pool({
        connectionString: config.connectionString,
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

  static fromDrizzleConfig(
    drizzleConfig: {
      driver: string;
      dbCredentials: {
        connectionString?: string;
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        database?: string;
      };
    },
    schema: any
  ): AerieConfig['database'] {
    if (drizzleConfig.driver !== 'pg') {
      throw new Error('Invalid driver type for PostgreSQL');
    }

    return {
      dialect: 'postgres',
      connectionString:
        drizzleConfig.dbCredentials.connectionString ||
        `postgresql://${drizzleConfig.dbCredentials.user}:${drizzleConfig.dbCredentials.password}@${drizzleConfig.dbCredentials.host}:${drizzleConfig.dbCredentials.port}/${drizzleConfig.dbCredentials.database}`,
      schema,
    };
  }
}
