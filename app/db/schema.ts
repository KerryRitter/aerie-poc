import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  image: text('image'),
  credits: integer('credits').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: serial('user_id')
    .references(() => users.id)
    .notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: timestamp('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

type IdeaStatus = 'todo' | 'selected' | 'ready' | 'published';

export const ideas = pgTable('ideas', {
  id: serial('id').primaryKey(),
  userId: serial('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().$type<IdeaStatus>().default('todo'),
  questions: jsonb('questions').$type<{ question: string; answer: string }[]>(),
  blogPost: text('blog_post'),
  videoScript: text('video_script'),
  linkedinPosts: jsonb('linkedin_posts').$type<string[]>(),
  xPosts: jsonb('x_posts').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: serial('user_id')
    .references(() => users.id)
    .notNull(),
  amount: integer('amount').notNull(),
  credits: integer('credits').notNull(),
  stripePaymentId: text('stripe_payment_id').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cats = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  breed: text('breed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
