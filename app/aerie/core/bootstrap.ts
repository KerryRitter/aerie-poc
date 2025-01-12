import { Router } from './router';
import type { Constructor } from './types';
import { getModuleMetadata } from './decorators/module.decorator';

export class AppBootstrap {
  private static instance: AppBootstrap;
  private router: Router;
  private registeredModules = new Set<Constructor>();

  private constructor() {
    this.router = Router.getInstance();
  }

  static getInstance(): AppBootstrap {
    if (!AppBootstrap.instance) {
      AppBootstrap.instance = new AppBootstrap();
    }
    return AppBootstrap.instance;
  }

  registerModule(moduleClass: Constructor) {
    if (this.registeredModules.has(moduleClass)) {
      return this;
    }

    console.log('Registering module:', moduleClass.name);
    const metadata = getModuleMetadata(moduleClass);
    if (!metadata) {
      throw new Error(
        `Module ${moduleClass.name} is not decorated with @Module`
      );
    }

    // Register imports first
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        this.registerModule(importedModule);
      }
    }

    // Register providers first
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        this.router.getContainer().register(provider);
      }
    }

    // Register controllers
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        this.router.getContainer().register(controller);
      }
    }

    // Now register routes after all controllers are registered
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        this.router.registerController(controller);
      }
    }

    this.registeredModules.add(moduleClass);
    return this;
  }

  getRouter() {
    return this.router;
  }
}

export function bootstrap() {
  return AppBootstrap.getInstance();
}
