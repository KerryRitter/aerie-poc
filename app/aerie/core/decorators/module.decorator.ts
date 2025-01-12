/// <reference types="reflect-metadata" />
import 'reflect-metadata';
import type { Type } from '../types';
import { getControllerMetadata } from './http.decorator';

export const MODULE_METADATA_KEY = Symbol('MODULE');

export type ModuleOptions = {
  imports?: Type[];
  controllers?: Type[];
  providers?: Type[];
  exports?: Type[];
};

export type ModuleMetadata = {
  imports?: Type[];
  apiControllers: Type[];
  viewControllers: Type[];
  providers?: Type[];
  exports?: Type[];
};

export function Module(options: ModuleOptions) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    console.log('Applying Module decorator to:', target.name);

    // Split controllers into api and view controllers
    const apiControllers: Type[] = [];
    const viewControllers: Type[] = [];

    if (options.controllers) {
      for (const controller of options.controllers) {
        const metadata = getControllerMetadata(controller);
        if (!metadata) {
          throw new Error(
            `${controller.name} in ${target.name} must be decorated with @ApiController or @ViewController`
          );
        }

        if (metadata.type === 'api') {
          apiControllers.push(controller);
        } else if (metadata.type === 'view') {
          viewControllers.push(controller);
        }
      }
    }

    const metadata: ModuleMetadata = {
      ...options,
      apiControllers,
      viewControllers,
    };

    console.log('Setting module metadata:', {
      module: target.name,
      apiControllers: apiControllers.map((c) => c.name),
      viewControllers: viewControllers.map((c) => c.name),
    });

    Reflect.defineMetadata(MODULE_METADATA_KEY, metadata, target);
    return target;
  };
}

export function getModuleMetadata(target: any): ModuleMetadata | undefined {
  return Reflect.getMetadata(MODULE_METADATA_KEY, target);
}
