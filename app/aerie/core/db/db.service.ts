import { Dependencies, Injectable } from '../decorators/injectable.decorator';
import { ServerOnly } from '../environment/decorators';
import { Kysely } from 'kysely';
import { AerieConfig } from '../aerie-config';
import type { PostgresDb, MySqlDb, SqliteDb } from './dialects';
import { DbDialectFactory } from './dialects/dialect.factory';

export type DbType<TSchema extends Record<string, unknown>> = {
  postgres: PostgresDb<TSchema>;
  mysql: MySqlDb<TSchema>;
  sqlite: SqliteDb<TSchema>;
};

@Injectable()
@Dependencies(AerieConfig, DbDialectFactory)
@ServerOnly()
export class DbService<TSchema extends Record<string, unknown>> {
  private _orm?: DbType<TSchema>[keyof DbType<TSchema>];
  private _qb?: Kysely<TSchema>;
  private readonly isEnabled: boolean;

  constructor(
    private readonly config: AerieConfig,
    private readonly dialectFactory: DbDialectFactory
  ) {
    console.log('DbService constructor - config:', config);
    console.log('DbService constructor - database config:', config.database);
    this.isEnabled = config.database.dialect !== 'none';
    console.log('DbService constructor - isEnabled:', this.isEnabled);
  }

  async initializeConnection() {
    console.log('DbService initializeConnection - config:', this.config);
    console.log(
      'DbService initializeConnection - database config:',
      this.config.database
    );
    const dbConfig = this.config.database;
    if (!dbConfig?.schema) {
      console.log('No schema provided, skipping initialization');
      return;
    }

    const dialect = this.dialectFactory.get<TSchema>(dbConfig.dialect);
    if (!dialect) {
      console.log('No dialect found for', dbConfig.dialect);
      return;
    }

    try {
      const connection = await dialect.initialize(dbConfig);
      this._orm = connection.orm;
      this._qb = connection.qb;
      console.log('DbService initializeConnection - connection initialized');
    } catch (err) {
      console.error('Failed to initialize connection:', err);
      throw err;
    }
  }

  get orm() {
    if (!this.isEnabled) {
      throw new Error(
        'Database is not enabled. Set dialect to postgres, mysql, or sqlite to enable.'
      );
    }
    if (!this._orm) {
      throw new Error('Database not initialized - did you provide a schema?');
    }
    return this._orm;
  }

  get qb() {
    if (!this.isEnabled) {
      throw new Error(
        'Database is not enabled. Set dialect to postgres, mysql, or sqlite to enable.'
      );
    }
    if (!this._qb) {
      throw new Error('Database not initialized - did you provide a schema?');
    }
    return this._qb;
  }
}
