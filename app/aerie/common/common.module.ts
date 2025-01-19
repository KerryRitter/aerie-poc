import { AerieConfig } from '@aerie/core/aerie-config';
import { Module } from '@aerie/core/decorators';
import { DbModule } from '@aerie/db';
import { LoggerModule } from '@aerie/logging/logger.module';
import {
  DefaultValuePipe,
  ParseBoolPipe,
  ParseIntPipe,
  ValidationPipe,
} from './pipes';

@Module({
  imports: [DbModule, LoggerModule.forRoot()],
  providers: [
    // Core providers
    AerieConfig,
    ParseIntPipe,
    ParseBoolPipe,
    DefaultValuePipe,
    ValidationPipe,
  ],
  exports: [AerieConfig],
})
export class AerieCommonModule {}
