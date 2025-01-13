import type { Type } from './types';
import { AerieConfig } from './aerie-config';
import { Router } from './router';
import { getModuleMetadata, Module } from './decorators/module.decorator';
import { AerieCommonModule } from './common/common.module';
import { DbService } from './db';
import { Container } from './container';

export class AppBootstrap {
  private static instance: AppBootstrap;
  private isInitialized = false;
  private config: AerieConfig;
  private router: Router;
  private registeredModules = new Set<Type>();

  static async initializeRoot<TModule extends Type>(
    rootModule: TModule,
    config: Omit<Partial<AerieConfig>, 'rootModule'> = {}
  ) {
    const app = this.getInstance({
      rootModule,
      ...config,
    });
    await app.ensureRootInitialized();
    return app;
  }

  static getInstance(config: Partial<AerieConfig>) {
    if (!this.instance) {
      this.instance = new AppBootstrap(config);
    }
    return this.instance;
  }

  private constructor(config: Partial<AerieConfig>) {
    // Create and store the config instance first
    const configInstance = AerieConfig.initialize(config);

    // Register the actual instance in the container before anything else
    const container = Container.getInstance();
    container.register(AerieConfig);
    container.setInstance(AerieConfig, configInstance);

    // Now initialize router with our config
    this.config = configInstance;
    this.router = Router.getInstance(this.config);
  }

  async ensureRootInitialized() {
    if (this.isInitialized) {
      return this;
    }

    // Register AerieCommonModule first to ensure core services are available
    await this.registerModule(AerieCommonModule);

    // Initialize DbService if needed
    if (this.config.database.dialect !== 'none') {
      console.log('Initializing DB with config:', this.config.database);
      const dbService = this.router
        .getContainer()
        .resolve<DbService<any>>(DbService);
      await dbService.initializeConnection();
    }

    // Register the root module with AerieCommonModule automatically imported
    const rootMetadata = getModuleMetadata(this.config.rootModule);
    if (!rootMetadata) {
      throw new Error(
        `Root module ${this.config.rootModule.name} is not decorated with @Module`
      );
    }

    // Create a new module that extends the root module
    @Module({
      imports: [...(rootMetadata.imports || [])],
      controllers:
        rootMetadata.apiControllers?.concat(
          rootMetadata.viewControllers || []
        ) || [],
      providers: [...(rootMetadata.providers || [])],
    })
    class EnhancedRootModule extends this.config.rootModule {}

    await this.registerModule(EnhancedRootModule);
    this.isInitialized = true;
    return this;
  }

  private async registerModule(moduleClass: Type) {
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
        await this.registerModule(importedModule);
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
