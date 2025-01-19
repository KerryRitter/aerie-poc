import { BadRequestException, Injectable, Type } from '@aerie/core';
import { ArgumentMetadata, PipeTransform } from './types';

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
