import { Module } from '../decorators/module.decorator';
import {
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  ValidationPipe,
} from '../pipes';

@Module({
  providers: [ParseIntPipe, ParseBoolPipe, DefaultValuePipe, ValidationPipe],
  // exports: [ParseIntPipe, ParseBoolPipe, DefaultValuePipe, ValidationPipe],
})
export class AerieCommonModule {}
