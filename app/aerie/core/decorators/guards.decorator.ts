import { Guard, Type } from '../types';
import { GUARDS_METADATA } from '../reflect';

export function UseGuards(...guards: (Type<Guard> | Guard)[]) {
  return function (target: any, propertyKey?: string | symbol) {
    const existingGuards = Reflect.getMetadata(GUARDS_METADATA, target) || [];
    const guardInstances = guards.map((guard) =>
      typeof guard === 'function' ? new guard() : guard
    );

    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        GUARDS_METADATA,
        [...existingGuards, ...guardInstances],
        target,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(
        GUARDS_METADATA,
        [...existingGuards, ...guardInstances],
        target
      );
    }
  };
}
