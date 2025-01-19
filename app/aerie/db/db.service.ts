import { AerieConfig, Dependencies, Injectable, ServerOnly } from '@aerie/core';
import { Kysely } from 'kysely';
import type { MySqlDb, PostgresDb, SqliteDb } from './dialects';
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
  private initializationPromise?: Promise<void>;
  private initializationError?: Error;

  constructor(
    private readonly config: AerieConfig,
    private readonly dialectFactory: DbDialectFactory
  ) {
    console.log('DbService constructor - config:', config);
    console.log('DbService constructor - database config:', config.database);
    this.isEnabled = config.database.dialect !== 'none';
    console.log('DbService constructor - isEnabled:', this.isEnabled);

    // Start initialization if database is enabled
    if (this.isEnabled) {
      this.initializationPromise = this.initializeConnection().catch((err) => {
        this.initializationError = err;
        throw err;
      });
    }
  }

  async initializeConnection() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    console.log('DbService initializeConnection - config:', this.config);
    console.log(
      'DbService initializeConnection - database config:',
      this.config.database
    );

    if (!this.isEnabled) {
      throw new Error(
        'Database is not enabled. Make sure drizzle.config.ts exists and is properly configured.'
      );
    }

    const dbConfig = this.config.database;
    if (!dbConfig?.schema) {
      throw new Error('No schema provided for database initialization');
    }

    const dialect = this.dialectFactory.get<TSchema>(dbConfig.dialect);
    if (!dialect) {
      throw new Error(
        `No dialect implementation found for ${dbConfig.dialect}`
      );
    }

    try {
      const connection = await dialect.initialize(dbConfig);
      this._orm = connection.orm;
      this._qb = connection.qb;
      console.log('DbService initializeConnection - connection initialized');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to initialize database connection: ${message}`);
    }
  }

  get orm() {
    if (!this.isEnabled) {
      throw new Error(
        'Database is not enabled. Make sure drizzle.config.ts exists and is properly configured.'
      );
    }
    if (this.initializationError) {
      throw this.initializationError;
    }
    if (!this._orm) {
      throw new Error(
        'Database connection not initialized. Make sure you have imported DbModule and waited for initialization to complete.'
      );
    }
    return this._orm;
  }

  get qb() {
    if (!this.isEnabled) {
      throw new Error(
        'Database is not enabled. Make sure drizzle.config.ts exists and is properly configured.'
      );
    }
    if (this.initializationError) {
      throw this.initializationError;
    }
    if (!this._qb) {
      throw new Error(
        'Database connection not initialized. Make sure you have imported DbModule and waited for initialization to complete.'
      );
    }
    return this._qb;
  }
}
