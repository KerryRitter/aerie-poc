import { Type } from '../types';
import { Router } from '../router';
import { getControllerMetadata } from './http.decorator';

export const MODULE_METADATA_KEY = Symbol('MODULE');
export const MODULE_REF_KEY = Symbol('MODULE_REF');

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
  return function (target: Type) {
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
    };

    Reflect.defineMetadata(MODULE_METADATA_KEY, metadata, target);

    return class extends target {
      constructor(...args: any[]) {
        super();

        // Find the router instance in the constructor args
        const router = args.find((arg): arg is Router => arg instanceof Router);

        if (router && options.controllers) {
          console.log('Registering controllers for module:', target.name);
          options.controllers.forEach((controller) => {
            console.log('Registering controller:', controller.name);
            router.registerController(controller);
          });
        } else if (options.controllers) {
          console.warn(
            'No router instance found when constructing module:',
            target.name
          );
        }
      }
    };
  };
}

export function getModuleMetadata(target: any): ModuleMetadata | undefined {
  return Reflect.getMetadata(MODULE_METADATA_KEY, target);
}

export function getModuleRef(target: Type): Type | undefined {
  return Reflect.getMetadata(MODULE_REF_KEY, target);
}
