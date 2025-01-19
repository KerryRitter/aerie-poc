import {
  Type,
  DynamicModule,
  MiddlewareProvider,
  Guard,
  Interceptor,
  Middleware,
} from '../types';
import { Router } from '../router';
import { getControllerMetadata } from './http.decorator';

export const MODULE_METADATA_KEY = Symbol('MODULE');
export const MODULE_REF_KEY = Symbol('MODULE_REF');
export const DYNAMIC_MODULE_KEY = Symbol('DYNAMIC_MODULE');
export const MODULE_MIDDLEWARE_KEY = Symbol('MODULE_MIDDLEWARE');
export const MODULE_GUARDS_KEY = Symbol('MODULE_GUARDS');
export const MODULE_INTERCEPTORS_KEY = Symbol('MODULE_INTERCEPTORS');

export type ModuleOptions = {
  imports?: (Type | DynamicModule)[];
  controllers?: Type[];
  providers?: Type[];
  exports?: (Type | string | symbol)[];
  middleware?: MiddlewareProvider[];
  guards?: Type<Guard>[];
  interceptors?: Type<Interceptor>[];
};

export type ModuleMetadata = {
  imports?: (Type | DynamicModule)[];
  apiControllers: Type[];
  viewControllers: Type[];
  providers?: Type[];
  exports?: (Type | string | symbol)[];
  middleware?: MiddlewareProvider[];
  guards?: Type<Guard>[];
  interceptors?: Type<Interceptor>[];
};

export interface IModuleClass {
  forRoot?(...args: any[]): DynamicModule;
  forRootAsync?(options: any): Promise<DynamicModule>;
}

export function UseModuleMiddleware(...middleware: Type<Middleware>[]) {
  return function (target: Type) {
    const existingMiddleware =
      Reflect.getMetadata(MODULE_MIDDLEWARE_KEY, target) || [];
    Reflect.defineMetadata(
      MODULE_MIDDLEWARE_KEY,
      [...existingMiddleware, ...middleware],
      target
    );
    return target;
  };
}

export function UseModuleGuards(...guards: Type<Guard>[]) {
  return function (target: Type) {
    const existingGuards = Reflect.getMetadata(MODULE_GUARDS_KEY, target) || [];
    Reflect.defineMetadata(
      MODULE_GUARDS_KEY,
      [...existingGuards, ...guards],
      target
    );
    return target;
  };
}

export function UseModuleInterceptors(...interceptors: Type<Interceptor>[]) {
  return function (target: Type) {
    const existingInterceptors =
      Reflect.getMetadata(MODULE_INTERCEPTORS_KEY, target) || [];
    Reflect.defineMetadata(
      MODULE_INTERCEPTORS_KEY,
      [...existingInterceptors, ...interceptors],
      target
    );
    return target;
  };
}

export function Module(options: ModuleOptions): ClassDecorator {
  return function (target: any) {
    // Define forRoot and forRootAsync first if they exist in prototype or as static methods
    if (target.prototype.forRoot || target.forRoot) {
      const originalForRoot = target.forRoot || target.prototype.forRoot;
      const forRootFn = function forRoot(
        this: any,
        ...args: any[]
      ): DynamicModule {
        const config = originalForRoot.apply(
          this === target ? undefined : this,
          args
        );
        const dynamicModule = { ...config, module: target };
        Reflect.defineMetadata(DYNAMIC_MODULE_KEY, dynamicModule, target);
        return dynamicModule;
      };

      // Define as both static and instance method
      Object.defineProperty(target, 'forRoot', {
        value: forRootFn,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(target.prototype, 'forRoot', {
        value: forRootFn,
        configurable: true,
        writable: true,
      });
    }

    if (target.prototype.forRootAsync || target.forRootAsync) {
      const originalForRootAsync =
        target.forRootAsync || target.prototype.forRootAsync;
      const forRootAsyncFn = async function forRootAsync(
        this: any,
        options: any
      ): Promise<DynamicModule> {
        const config = await originalForRootAsync.call(
          this === target ? undefined : this,
          options
        );
        const dynamicModule = { ...config, module: target };
        Reflect.defineMetadata(DYNAMIC_MODULE_KEY, dynamicModule, target);
        return dynamicModule;
      };

      // Define as both static and instance method
      Object.defineProperty(target, 'forRootAsync', {
        value: forRootAsyncFn,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(target.prototype, 'forRootAsync', {
        value: forRootAsyncFn,
        configurable: true,
        writable: true,
      });
    }

    // Split controllers into api and view controllers
    const apiControllers: Type[] = [];
    const viewControllers: Type[] = [];

    if (options.controllers) {
      for (const controller of options.controllers) {
        const metadata = getControllerMetadata(controller);
        if (!metadata) {
          throw new Error(
            `${controller.name} in ${target.name} must be decorated with @Controller`
          );
        }

        // Store reference to the module in the controller
        Reflect.defineMetadata(MODULE_REF_KEY, target, controller);

        if (metadata.type === 'api') {
          apiControllers.push(controller);
        } else if (metadata.type === 'view') {
          viewControllers.push(controller);
        }
      }
    }

    // Store module reference in providers
    if (options.providers) {
      for (const provider of options.providers) {
        Reflect.defineMetadata(MODULE_REF_KEY, target, provider);
      }
    }

    const metadata: ModuleMetadata = {
      ...options,
      apiControllers,
      viewControllers,
      middleware: [],
      guards: [],
      interceptors: [],
    };

    // Apply module-level middleware, guards, and interceptors to all controllers
    const moduleMiddleware =
      Reflect.getMetadata(MODULE_MIDDLEWARE_KEY, target) || [];
    const moduleGuards = Reflect.getMetadata(MODULE_GUARDS_KEY, target) || [];
    const moduleInterceptors =
      Reflect.getMetadata(MODULE_INTERCEPTORS_KEY, target) || [];

    metadata.middleware = [...(options.middleware || []), ...moduleMiddleware];
    metadata.guards = [...(options.guards || []), ...moduleGuards];
    metadata.interceptors = [
      ...(options.interceptors || []),
      ...moduleInterceptors,
    ];

    Reflect.defineMetadata(MODULE_METADATA_KEY, metadata, target);

    // Make sure the target is properly constructable
    if (typeof target === 'function') {
      return target;
    }

    return target;
  };
}

export function getModuleMetadata(target: any): ModuleMetadata | undefined {
  return Reflect.getMetadata(MODULE_METADATA_KEY, target);
}

export function getModuleRef(target: Type): Type | undefined {
  return Reflect.getMetadata(MODULE_REF_KEY, target);
}

export function getDynamicModuleMetadata(
  target: Type
): DynamicModule | undefined {
  return Reflect.getMetadata(DYNAMIC_MODULE_KEY, target);
}
