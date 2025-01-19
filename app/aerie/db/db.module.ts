import { Module } from '@aerie/core';
import { DbService } from './db.service';
import {
  DbDialectFactory,
  MySqlDbDialect,
  PostgresDbDialect,
  SqliteDbDialect,
} from './dialects';

@Module({
  providers: [
    DbService,
    DbDialectFactory,
    PostgresDbDialect,
    MySqlDbDialect,
    SqliteDbDialect,
  ],
  exports: [DbService],
})
export class DbModule {}
