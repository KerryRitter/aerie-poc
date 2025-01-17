import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { DbService } from '@aerie/core/db';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .defaultNow(),
});

export const cats = sqliteTable('cats', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  breed: text('breed'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .defaultNow(),
});

export type Schema = {
  users: {
    id?: number;
    name: string;
    email: string;
    createdAt: Date;
  };
  cats: {
    id?: number;
    name: string;
    age: number;
    breed?: string;
    createdAt: Date;
  };
};

export type MyDbService = DbService<Schema>;
