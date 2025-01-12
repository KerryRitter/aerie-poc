import { Router } from './router';
import type { Constructor } from './types';
import { getModuleMetadata } from './decorators/module.decorator';
import { AerieConfig } from './aerie-config';

export class AppBootstrap {
  private static instance: AppBootstrap;
  private router: Router;
  private registeredModules = new Set<Constructor>();
  private isInitialized = false;

  private constructor(private readonly config: AerieConfig) {
    this.router = Router.getInstance(this.config);
  }

  static getInstance(config: AerieConfig): AppBootstrap {
    if (!AppBootstrap.instance) {
      AppBootstrap.instance = new AppBootstrap(config);
    }
    return AppBootstrap.instance;
  }

  ensureRootInitialized() {
    if (this.isInitialized) {
      return this;
    }

    this.registerModule(this.config.rootModule);
    this.isInitialized = true;
    return this;
  }

  private registerModule(moduleClass: Constructor) {
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

    // Register API controllers
    if (metadata.apiControllers) {
      for (const controller of metadata.apiControllers) {
        this.router.getContainer().register(controller);
      }
    }

    // Register view controllers
    if (metadata.viewControllers) {
      for (const controller of metadata.viewControllers) {
        this.router.getContainer().register(controller);
      }
    }

    // Now register routes after all controllers are registered
    if (metadata.apiControllers) {
      for (const controller of metadata.apiControllers) {
        this.router.registerController(controller);
      }
    }

    if (metadata.viewControllers) {
      for (const controller of metadata.viewControllers) {
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

export function bootstrap(config: AerieConfig) {
  return AppBootstrap.getInstance(config);
}
