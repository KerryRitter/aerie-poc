import type {
  Type,
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
} from './types';
import {
  getInjectableMetadata,
  getInjectMetadata,
  getDependenciesMetadata,
  InjectToken,
} from './decorators/injectable.decorator';

// Store metadata at module load time
const metadataStore = new Map<string, any>();

export class Container {
  private static instance: Container;
  private providers = new Map<string, Provider>();
  private instances = new Map<string, any>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(provider: Provider) {
    const key = this.getProviderKey(this.getProviderToken(provider));
    if (this.providers.has(key)) {
      return;
    }

    if (typeof provider === 'function') {
      // Store metadata when registering a class provider
      if (!metadataStore.has(key)) {
        const dependencies = getDependenciesMetadata(provider) || [];
        const injectableMetadata = getInjectableMetadata(provider);
        const injectMetadata = getInjectMetadata(provider);

        metadataStore.set(key, {
          dependencies,
          injectableMetadata,
          injectMetadata,
        });
      }
    }

    this.providers.set(key, provider);
  }

  async resolve<T>(token: InjectToken): Promise<T> {
    const key = this.getProviderKey(token);
    const provider = this.providers.get(key);

    if (!provider) {
      throw new Error(`No provider found for ${key}`);
    }

    // Check if we already have an instance
    const existingInstance = this.instances.get(key);
    if (existingInstance) {
      return existingInstance;
    }

    const instance = await this.createInstance<T>(provider);

    // Cache instance if singleton (default)
    const metadata = metadataStore.get(key);
    if (
      !metadata?.injectableMetadata?.scope ||
      metadata.injectableMetadata.scope === 'singleton'
    ) {
      this.instances.set(key, instance);
    }

    return instance;
  }

  private async createInstance<T>(provider: Provider): Promise<T> {
    if (typeof provider === 'function') {
      // Handle class provider (direct Type)
      const metadata = metadataStore.get(provider.name) || {
        dependencies: [],
        injectableMetadata: {},
        injectMetadata: {},
      };

      const resolvedDependencies = await Promise.all(
        metadata.dependencies.map(
          async (dependency: InjectToken, index: number) => {
            const injectToken = metadata.injectMetadata?.[index];
            return this.resolve(injectToken || dependency);
          }
        )
      );

      return new provider(...resolvedDependencies);
    }

    if (this.isClassProvider(provider)) {
      // Handle useClass
      const { useClass, inject = [] } = provider;
      const deps = await Promise.all(inject.map((dep) => this.resolve(dep)));
      return new useClass(...deps);
    }

    if (this.isValueProvider(provider)) {
      // Handle useValue
      return provider.useValue;
    }

    if (this.isFactoryProvider(provider)) {
      // Handle useFactory
      const { useFactory, inject = [] } = provider;
      const deps = await Promise.all(inject.map((dep) => this.resolve(dep)));
      return useFactory(...deps);
    }

    throw new Error(
      `Invalid provider type for ${this.getProviderKey(this.getProviderToken(provider))}`
    );
  }

  private getProviderKey(token: InjectToken): string {
    if (typeof token === 'string') {
      return token;
    }
    if (typeof token === 'symbol') {
      return token.toString();
    }
    return token.name;
  }

  private getProviderToken(provider: Provider): InjectToken {
    if (typeof provider === 'function') {
      return provider;
    }
    return provider.provide;
  }

  private isClassProvider(provider: Provider): provider is ClassProvider {
    return typeof provider === 'object' && 'useClass' in provider;
  }

  private isValueProvider(provider: Provider): provider is ValueProvider {
    return typeof provider === 'object' && 'useValue' in provider;
  }

  private isFactoryProvider(provider: Provider): provider is FactoryProvider {
    return typeof provider === 'object' && 'useFactory' in provider;
  }

  setInstance<T>(token: InjectToken, instance: T) {
    const key = this.getProviderKey(token);
    this.instances.set(key, instance);
  }

  getAllRegistered(): Type[] {
    return Array.from(this.providers.values()).map((p) =>
      'useClass' in p ? p.useClass : p
    ) as Type[];
  }
}
