import { Middleware, Type, MiddlewareFunction } from '../types';
import { MIDDLEWARE_METADATA } from '../reflect';

type MiddlewareClass = Type<{ use: MiddlewareFunction }>;

export function UseMiddleware(
  ...middleware: (MiddlewareClass | { use: MiddlewareFunction })[]
) {
  return function (target: any, propertyKey?: string | symbol) {
    const existingMiddleware =
      Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
    const middlewareInstances = middleware.map((m) =>
      typeof m === 'function' ? new m() : m
    );

    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddleware, ...middlewareInstances],
        target,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddleware, ...middlewareInstances],
        target
      );
    }
  };
}
