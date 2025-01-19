import { Injectable } from '@aerie/core';
import { PipeTransform, ArgumentMetadata } from './types';

@Injectable()
export class DefaultValuePipe<T = any>
  implements PipeTransform<T | undefined | null, T>
{
  constructor(private readonly defaultValue: T) {}

  transform(value: T | undefined | null, metadata: ArgumentMetadata): T {
    return value === null || value === undefined ? this.defaultValue : value;
  }
}
