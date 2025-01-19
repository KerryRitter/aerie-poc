import { BadRequestException, Injectable } from '@aerie/core';
import { ArgumentMetadata, PipeTransform } from './types';

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
