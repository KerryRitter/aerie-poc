import type { Type } from './types';
import {
  getInjectableMetadata,
  getInjectMetadata,
  InjectToken,
} from './decorators/injectable.decorator';

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

    // Get injectable metadata
    const injectableMetadata = getInjectableMetadata(provider);
    const injectMetadata = getInjectMetadata(provider);

    // Get constructor parameter types
    const paramTypes = Reflect.getMetadata('design:paramtypes', provider) || [];

    // Resolve dependencies recursively
    const dependencies = paramTypes.map((paramType: Type, index: number) => {
      // Check if we have a custom injection token
      const injectToken = injectMetadata?.[index];
      if (injectToken) {
        return this.resolve(injectToken);
      }
      return this.resolve(paramType);
    });

    // Create instance
    const instance = new provider(...dependencies);

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
}
