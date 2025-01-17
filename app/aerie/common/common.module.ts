import {
  DefaultValuePipe,
  ParseBoolPipe,
  ParseIntPipe,
  ValidationPipe,
} from '@aerie/common/pipes';
import { AerieConfig } from '@aerie/core/aerie-config';
import { Module } from '@aerie/core/decorators';
import { DbService } from '@aerie/db';
import { DbDialectFactory } from '@aerie/db/dialects/dialect.factory';
import { MySqlDbDialect } from '@aerie/db/dialects/mysql';
import { PostgresDbDialect } from '@aerie/db/dialects/postgres';
import { SqliteDbDialect } from '@aerie/db/dialects/sqlite';

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
