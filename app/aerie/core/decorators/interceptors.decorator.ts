import { Interceptor, Type } from '../types';
import { INTERCEPTORS_METADATA } from '../reflect';

export function UseInterceptors(
  ...interceptors: (Type<Interceptor> | Interceptor)[]
) {
  return function (target: any, propertyKey?: string | symbol) {
    const existingInterceptors =
      Reflect.getMetadata(INTERCEPTORS_METADATA, target) || [];
    const interceptorInstances = interceptors.map((interceptor) =>
      typeof interceptor === 'function' ? new interceptor() : interceptor
    );

    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        INTERCEPTORS_METADATA,
        [...existingInterceptors, ...interceptorInstances],
        target,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(
        INTERCEPTORS_METADATA,
        [...existingInterceptors, ...interceptorInstances],
        target
      );
    }
  };
}
