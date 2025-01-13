import {
  Injectable,
  Dependencies,
} from '../../decorators/injectable.decorator';
import { ServerOnly } from '../../environment/decorators';
import type { DbDialect } from './dialect.interface';
import { PostgresDbDialect, MySqlDbDialect, SqliteDbDialect } from '.';

type Dialect = 'none' | 'postgres' | 'mysql' | 'sqlite';

@Injectable()
@Dependencies(PostgresDbDialect, MySqlDbDialect, SqliteDbDialect)
@ServerOnly()
export class DbDialectFactory {
  constructor(
    private readonly postgresDialect: PostgresDbDialect<any>,
    private readonly mysqlDialect: MySqlDbDialect<any>,
    private readonly sqliteDialect: SqliteDbDialect<any>
  ) {}

  get<TSchema extends Record<string, unknown>>(
    dialect: Dialect
  ): DbDialect<TSchema> | null {
    switch (dialect) {
      case 'postgres':
        return this.postgresDialect as DbDialect<TSchema>;
      case 'mysql':
        return this.mysqlDialect as DbDialect<TSchema>;
      case 'sqlite':
        return this.sqliteDialect as DbDialect<TSchema>;
      case 'none':
        return null;
      default:
        throw new Error(`Unsupported dialect: ${dialect}`);
    }
  }
}
