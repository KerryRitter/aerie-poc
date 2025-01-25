import { Container } from './container';
import { Router } from './router';
import type { Type, DynamicModule, DynamicModuleAsync } from './types';
import { AerieConfig } from './aerie-config';
import {
  getModuleMetadata,
  getDynamicModuleMetadata,
} from './decorators/module.decorator';
import { DbService } from '../db';

export class AppBootstrap {
  private static instance: AppBootstrap;
  private container: Container;
  private router: Router;

  private constructor() {
    this.container = Container.getInstance();
    this.router = null as any;
  }

  static async initializeRoot(
    rootModule: Type,
    config: any = {}
  ): Promise<AppBootstrap> {
    if (!AppBootstrap.instance) {
      AppBootstrap.instance = new AppBootstrap();
    }

    // Initialize config first
    const aerieConfig = await AerieConfig.initialize({
      ...config,
      rootModule,
    });
    AppBootstrap.instance.container.register(AerieConfig);
    AppBootstrap.instance.container.setInstance(AerieConfig, aerieConfig);

    // Initialize the router
    AppBootstrap.instance.router = Router.initialize(aerieConfig);

    // Initialize root module
    await AppBootstrap.instance.initializeModule(rootModule);

    // Initialize database
    await AppBootstrap.instance.initializeDb();

    return AppBootstrap.instance;
  }

  private async initializeModule(
    module: Type | DynamicModule | DynamicModuleAsync
  ) {
    const moduleClass = this.getModuleClass(module);
    const metadata = getModuleMetadata(moduleClass);
    const dynamicMetadata = getDynamicModuleMetadata(moduleClass);

    if (!metadata) {
      throw new Error(`${moduleClass.name} is not a valid module`);
    }

    // Register the module class itself
    this.container.register(moduleClass);

    // Register module providers
    const providers = [
      ...(metadata.providers || []),
      ...(dynamicMetadata?.providers || []),
    ];

    for (const provider of providers) {
      this.container.register(provider);
    }

    // Initialize imports recursively
    const imports = [
      ...(metadata.imports || []),
      ...(dynamicMetadata?.imports || []),
    ];

    for (const importedModule of imports) {
      await this.initializeModule(importedModule);
    }

    // Register controllers with the container
    if (metadata.apiControllers) {
      for (const controller of metadata.apiControllers) {
        this.container.register(controller);
      }
    }
    if (metadata.viewControllers) {
      for (const controller of metadata.viewControllers) {
        this.container.register(controller);
      }
    }

    // Create module instance with router
    await this.container.resolve(moduleClass);

    // Register routes after module is initialized
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
  }

  private getModuleClass(
    module: Type | DynamicModule | DynamicModuleAsync
  ): Type {
    if (typeof module === 'function') {
      return module;
    }
    return module.module;
  }

  createRemixApiRoute() {
    return this.router.createRemixApiRoute();
  }

  createRemixViewRoute() {
    return this.router.createRemixViewRoute();
  }

  private async initializeDb() {
    try {
      const dbService =
        await AppBootstrap.instance.container.resolve<DbService<any>>(
          DbService
        );
      await dbService.initializeConnection();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}
