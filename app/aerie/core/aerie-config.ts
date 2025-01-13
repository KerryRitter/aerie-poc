import { z } from 'zod';
import type { Type } from './types';
import { Injectable } from './decorators/injectable.decorator';

const configSchema = z.object({
  rootModule: z.any().refine((v): v is Type => typeof v === 'function', {
    message: 'rootModule must be a class constructor',
  }),
  viewGuardRedirect: z.string().optional(),
  database: z
    .object({
      url: z.string().optional(),
      host: z.string().optional(),
      port: z.number().optional(),
      user: z.string().optional(),
      password: z.string().optional(),
      database: z.string().optional(),
      file: z.string().optional(),
      dialect: z.enum(['none', 'postgres', 'mysql', 'sqlite']),
      schema: z.any(),
    })
    .default({ dialect: 'none', schema: {} }),
});

type ConfigSchema = z.infer<typeof configSchema>;

@Injectable()
export class AerieConfig implements ConfigSchema {
  private static instance: AerieConfig;
  rootModule!: Type;
  viewGuardRedirect?: string;
  database: ConfigSchema['database'];

  constructor() {
    // Initialize with defaults
    this.database = { dialect: 'none', schema: {} };
  }

  static initialize(config: Partial<ConfigSchema>): AerieConfig {
    const validated = configSchema.parse(config);

    if (!this.instance) {
      this.instance = new AerieConfig();
    }

    return Object.assign(this.instance, validated);
  }
}
