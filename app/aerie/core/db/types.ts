import { Kysely } from 'kysely';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export type DrizzleDatabase =
  | PostgresJsDatabase<any>
  | NodePgDatabase<any>
  | MySql2Database<any>
  | BetterSQLite3Database<any>;

export type Dialect = 'postgres' | 'mysql' | 'sqlite';

export type BaseConfig = {
  type: 'drizzle' | 'kysely';
  schema?: any;
};

export type PostgresConfig = BaseConfig & {
  dialect: 'postgres';
  url: string;
};

export type MySqlConfig = BaseConfig & {
  dialect: 'mysql';
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export type SqliteConfig = BaseConfig & {
  dialect: 'sqlite';
  file: string;
};

export type DatabaseConfig = PostgresConfig | MySqlConfig | SqliteConfig;

export type DbService<T = any> = {
  /** Drizzle ORM instance */
  orm: DrizzleDatabase;
  /** Kysely Query Builder instance */
  qb: Kysely<T>;
  /** Get a repository for a specific entity */
  getRepository<Entity>(entity: string): any;
};
