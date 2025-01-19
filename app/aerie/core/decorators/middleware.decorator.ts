import { Type, MiddlewareFunction } from '../types';
import { MIDDLEWARE_METADATA } from '../reflect';
import { Container } from '../container';

type MiddlewareClass = Type<{ use: MiddlewareFunction }>;
type MiddlewareProvider = MiddlewareClass | { use: MiddlewareFunction };

async function resolveMiddleware(
  middleware: MiddlewareProvider[]
): Promise<{ use: MiddlewareFunction }[]> {
  const container = Container.getInstance();
  return Promise.all(
    middleware.map(async (m) => {
      if (typeof m === 'function') {
        return await container.resolve(m);
      }
      return m;
    })
  );
}

export function UseMiddleware(...middleware: MiddlewareProvider[]) {
  return function (target: any, propertyKey?: string | symbol) {
    const existingMiddleware =
      Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];

    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        MIDDLEWARE_METADATA,
        [...existingMiddleware, ...middleware],
        target,
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

    return target;
  };
}

// This function should be called at runtime when middleware is needed
export async function getResolvedMiddleware(
  target: any,
  propertyKey?: string | symbol
): Promise<{ use: MiddlewareFunction }[]> {
  const middleware = propertyKey
    ? Reflect.getMetadata(MIDDLEWARE_METADATA, target, propertyKey) || []
    : Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];

  return resolveMiddleware(middleware);
}
