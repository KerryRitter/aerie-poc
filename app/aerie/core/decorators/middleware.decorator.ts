import { Middleware } from '../types';
import { MIDDLEWARE_METADATA } from '../reflect';

export function UseMiddleware(...middleware: Middleware[]) {
  return function (target: any, propertyKey?: string) {
    const existingMiddleware: Middleware[] =
      Reflect.getMetadata(MIDDLEWARE_METADATA, target.constructor) || [];

    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddleware, ...middleware],
        target.constructor,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddleware, ...middleware],
        target
      );
    }
  };
}
