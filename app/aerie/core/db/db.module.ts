import { Module } from '../decorators/module.decorator';
import { DbService } from './db.service';
import {
  DbDialectFactory,
  PostgresDbDialect,
  MySqlDbDialect,
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
