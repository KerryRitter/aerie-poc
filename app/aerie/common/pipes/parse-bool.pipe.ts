import { BadRequestException } from '../exceptions';
import { Injectable } from '../decorators/injectable.decorator';
import { PipeTransform, ArgumentMetadata } from './types';

@Injectable()
export class ParseBoolPipe implements PipeTransform<string, boolean> {
  transform(value: string, metadata: ArgumentMetadata): boolean {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    throw new BadRequestException(
      'Validation failed - expected a boolean string'
    );
  }
}
