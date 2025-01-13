import type { AerieConfig } from '../../aerie-config';

export interface DbDialect<TSchema extends Record<string, unknown>> {
  initialize(config: AerieConfig['database']): Promise<{
    orm: any;
    qb: any;
  }>;
}
