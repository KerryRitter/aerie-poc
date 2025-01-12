import type { Type } from '../types';

export const INJECTABLE_METADATA_KEY = Symbol('INJECTABLE_METADATA');
export const INJECT_METADATA_KEY = Symbol('INJECT_METADATA');
export const DEPENDENCIES_METADATA_KEY = Symbol('DEPENDENCIES_METADATA');

export type InjectableMetadata = {
  scope?: 'singleton' | 'transient';
};

export type InjectToken = Type<unknown> | string | symbol;

export function Injectable(options: InjectableMetadata = {}) {
  return function <T extends Type>(target: T) {
    console.log('=== INJECTABLE DECORATOR ===');
    console.log('Target:', target.name);
    console.log(
      'Dependencies:',
      Reflect.getMetadata(DEPENDENCIES_METADATA_KEY, target)
    );
    console.log('=== END INJECTABLE DECORATOR ===');

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
    console.log('=== INJECT DECORATOR ===');
    console.log('Target:', target.name);
    console.log('Property:', String(propertyKey));
    console.log('Parameter Index:', parameterIndex);
    console.log(
      'Token:',
      typeof token === 'function' ? token.name : String(token)
    );
    console.log('=== END INJECT DECORATOR ===');

    const existingInjectTokens =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || {};
    existingInjectTokens[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectTokens, target);
  };
}

export function Dependencies(...dependencies: InjectToken[]) {
  return function (target: Type) {
    console.log('=== DEPENDENCIES DECORATOR ===');
    console.log('Target:', target.name);
    console.log(
      'Dependencies:',
      dependencies.map((d) => (typeof d === 'function' ? d.name : String(d)))
    );
    console.log('=== END DEPENDENCIES DECORATOR ===');

    Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, dependencies, target);
    return target;
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

export function getDependenciesMetadata(
  target: Type
): InjectToken[] | undefined {
  return Reflect.getMetadata(DEPENDENCIES_METADATA_KEY, target);
}
