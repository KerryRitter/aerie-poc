import type { Type } from './types';
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
  private providers = new Map<string, Type>();
  private instances = new Map<string, any>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(provider: Type) {
    const key = provider.name;
    if (this.providers.has(key)) {
      return;
    }

    console.log('=== REGISTERING PROVIDER ===');
    console.log('Provider:', key);
    console.log('Dependencies:', getDependenciesMetadata(provider));
    console.log('=== END REGISTERING PROVIDER ===');

    // Store metadata when registering the provider
    if (!metadataStore.has(key)) {
      const dependencies = getDependenciesMetadata(provider) || [];
      const injectableMetadata = getInjectableMetadata(provider);
      const injectMetadata = getInjectMetadata(provider);

      console.log('=== STORING METADATA ===');
      console.log('Key:', key);
      console.log('Dependencies:', dependencies);
      console.log('Injectable Metadata:', injectableMetadata);
      console.log('Inject Metadata:', injectMetadata);
      console.log('=== END STORING METADATA ===');

      metadataStore.set(key, {
        dependencies,
        injectableMetadata,
        injectMetadata,
      });
    }

    this.providers.set(key, provider);
  }

  resolve<T>(token: InjectToken): T {
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

    console.log('=== RESOLVING PROVIDER ===');
    console.log('Token:', key);
    console.log('Provider:', provider.name);
    console.log('Metadata Store:', metadataStore);
    console.log('=== END RESOLVING PROVIDER ===');

    // Get metadata from our store
    const metadata = metadataStore.get(key) || {
      dependencies: [],
      injectableMetadata: {},
      injectMetadata: {},
    };

    const { dependencies, injectableMetadata, injectMetadata } = metadata;

    // Resolve dependencies recursively
    const resolvedDependencies = dependencies.map(
      (dependency: InjectToken, index: number) => {
        // Check if we have a custom injection token
        const injectToken = injectMetadata?.[index];
        if (injectToken) {
          return this.resolve(injectToken);
        }
        return this.resolve(dependency);
      }
    );

    // Create instance
    const instance = new provider(...resolvedDependencies);

    // Cache instance if singleton (default)
    if (
      !injectableMetadata?.scope ||
      injectableMetadata.scope === 'singleton'
    ) {
      this.instances.set(key, instance);
    }

    return instance;
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

  setInstance<T>(token: InjectToken, instance: T) {
    const key = this.getProviderKey(token);
    this.instances.set(key, instance);
  }
}
