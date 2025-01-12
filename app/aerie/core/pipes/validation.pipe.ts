import { BadRequestException } from '../exceptions';
import { Injectable } from '../decorators/injectable.decorator';
import { PipeTransform, ArgumentMetadata } from './types';
import { Type } from '../types';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    if (value === null || value === undefined) {
      throw new BadRequestException('Value cannot be null or undefined');
    }

    return value;
  }

  private toValidate(metatype: Type): boolean {
    const types: Type[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
