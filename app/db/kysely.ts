import { Kysely, PostgresDialect } from 'kysely';
import pkg from 'pg';
import { env } from '~/env.server';

const { Pool } = pkg;

type User = {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

type Database = {
  users: User;
};

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
  }),
});

export const db = new Kysely<Database>({ dialect });
