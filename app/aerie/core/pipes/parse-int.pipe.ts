import { BadRequestException } from '../exceptions';
import { Injectable } from '../decorators/injectable.decorator';
import { PipeTransform, ArgumentMetadata } from './types';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed - expected a number');
    }
    return val;
  }
}
