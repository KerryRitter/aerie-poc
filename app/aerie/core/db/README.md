# Aerie Database Module

A flexible database module for the Aerie framework that supports multiple SQL dialects and ORMs.

## Features

- Support for PostgreSQL, MySQL, and SQLite
- Choose between Drizzle ORM or Kysely query builder
- Type-safe repository pattern
- Dynamic loading of database drivers (only loads what you use)

## Installation

```bash
# Core dependencies (always required)
npm install drizzle-orm kysely

# Database-specific drivers (install only what you need)
npm install pg        # For PostgreSQL
npm install mysql2    # For MySQL
npm install better-sqlite3  # For SQLite
```

## Usage

### Basic Setup

```typescript
import { createDbModule } from '~/aerie/core/db';
import * as schema from './db/schema';

@Module({
  imports: [
    createDbModule({
      dialect: 'postgres',
      url: process.env.DATABASE_URL,
      type: 'drizzle',
      schema,
    }),
  ],
})
export class AppModule {}
```

### Using Different Dialects

#### PostgreSQL

```typescript
createDbModule({
  dialect: 'postgres',
  url: process.env.DATABASE_URL,
  type: 'drizzle',
  schema,
});
```

#### MySQL

```typescript
createDbModule({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'mydb',
  type: 'drizzle',
  schema,
});
```

#### SQLite

```typescript
createDbModule({
  dialect: 'sqlite',
  file: ':memory:', // or path to file
  type: 'drizzle',
  schema,
});
```

### Using in Services

```typescript
import { Injectable } from '~/aerie/core/decorators';
import { DefaultDbService } from '~/aerie/core/db';

@Injectable()
export class YourService {
  constructor(private db: DefaultDbService) {}

  // Using Drizzle
  async findCats() {
    return this.db.getRepository('cats').findMany();
  }

  // Using Kysely
  async findCatsKysely() {
    return this.db.kysely.selectFrom('cats').selectAll().execute();
  }
}
```

## How it Works

The module uses dynamic imports to load database drivers on demand. This means:

1. Only the drivers you actually use are loaded
2. No need to install all database drivers
3. Smaller bundle size
4. Better startup performance

For example, if you're only using PostgreSQL:

```bash
npm install pg  # Only PostgreSQL driver is needed
```

The MySQL and SQLite drivers won't be loaded or required.
