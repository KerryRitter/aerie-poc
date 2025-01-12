import 'reflect-metadata';
import type { Type } from '../types';

export const INJECTABLE_METADATA_KEY = Symbol('INJECTABLE_METADATA');
export const INJECT_METADATA_KEY = Symbol('INJECT_METADATA');

export type InjectableMetadata = {
  scope?: 'singleton' | 'transient';
};

export type InjectToken = Type<unknown> | string | symbol;

export function Injectable(options: InjectableMetadata = {}) {
  return function <T extends Type>(target: T) {
    console.log('Applying Injectable decorator to:', target.name);
    console.log(
      'Constructor params:',
      Reflect.getMetadata('design:paramtypes', target)
    );
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, options, target);
    return target;
  };
}

export function Inject(token: InjectToken) {
  return function (
    target: Type,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    console.log('Applying Inject decorator:', {
      target: target.name,
      token: typeof token === 'function' ? token.name : String(token),
      parameterIndex,
    });
    const existingInjectTokens =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || {};
    existingInjectTokens[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectTokens, target);
  };
}

export function getInjectableMetadata(
  target: Type
): InjectableMetadata | undefined {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target);
}

export function getInjectMetadata(
  target: Type
): Record<number, InjectToken> | undefined {
  return Reflect.getMetadata(INJECT_METADATA_KEY, target);
}
