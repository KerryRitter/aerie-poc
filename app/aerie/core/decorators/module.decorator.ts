/// <reference types="reflect-metadata" />
import 'reflect-metadata';
import type { Constructor } from '../types';
import { getControllerMetadata } from './http.decorator';

export const MODULE_METADATA_KEY = Symbol('MODULE');

export type ModuleOptions = {
  imports?: Constructor[];
  controllers?: Constructor[];
  providers?: Constructor[];
  exports?: Constructor[];
};

export type ModuleMetadata = {
  imports?: Constructor[];
  apiControllers: Constructor[];
  viewControllers: Constructor[];
  providers?: Constructor[];
  exports?: Constructor[];
};

export function Module(options: ModuleOptions) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    console.log('Applying Module decorator to:', target.name);

    // Split controllers into api and view controllers
    const apiControllers: Constructor[] = [];
    const viewControllers: Constructor[] = [];

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
