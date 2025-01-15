import type { Config } from 'drizzle-kit';

export default {
  schema: './app/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.cwd() + '/db.sqlite',
  },
} satisfies Config;
