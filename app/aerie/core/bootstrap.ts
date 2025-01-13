import { Router } from './router';
import type { Type } from './types';
import { getModuleMetadata, Module } from './decorators/module.decorator';
import { AerieConfig } from './aerie-config';
import { AerieCommonModule } from './common/common.module';

export class AppBootstrap {
  private static instance: AppBootstrap;
  private router: Router;
  private registeredModules = new Set<Type>();
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

    // Register the root module with AerieCommonModule automatically imported
    const rootMetadata = getModuleMetadata(this.config.rootModule);
    if (!rootMetadata) {
      throw new Error(
        `Root module ${this.config.rootModule.name} is not decorated with @Module`
      );
    }

    // Create a new module that extends the root module and includes AerieCommonModule
    @Module({
      imports: [...(rootMetadata.imports || []), AerieCommonModule],
      controllers:
        rootMetadata.apiControllers?.concat(
          rootMetadata.viewControllers || []
        ) || [],
      providers: [...(rootMetadata.providers || [])],
    })
    class EnhancedRootModule extends this.config.rootModule {}

    this.registerModule(EnhancedRootModule);
    this.isInitialized = true;
    return this;
  }

  private registerModule(moduleClass: Type) {
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

  createRemixApiRoute() {
    return this.router.createRemixApiRoute();
  }

  createRemixViewRoute() {
    return this.router.createRemixViewRoute();
  }
}
