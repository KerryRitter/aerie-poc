import { Module } from '../decorators/module.decorator';
import {
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  ValidationPipe,
} from '../pipes';
import { AerieConfig } from '../aerie-config';
import { DbService } from '../db';
import { DbDialectFactory } from '../db/dialects/dialect.factory';
import { MySqlDbDialect } from '../db/dialects/mysql';
import { PostgresDbDialect } from '../db/dialects/postgres';
import { SqliteDbDialect } from '../db/dialects/sqlite';

@Module({
  providers: [
    // Core providers
    AerieConfig,
    ParseIntPipe,
    ParseBoolPipe,
    DefaultValuePipe,
    ValidationPipe,

    // Database providers in dependency order
    PostgresDbDialect,
    MySqlDbDialect,
    SqliteDbDialect,
    DbDialectFactory,
    DbService,
  ],
  exports: [AerieConfig, DbService],
})
export class AerieCommonModule {}
