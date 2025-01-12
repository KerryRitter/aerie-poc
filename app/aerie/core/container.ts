import type { Constructor } from './types';

export class Container {
  private static instance: Container;
  private providers = new Map<string, Constructor>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(provider: Constructor) {
    const key = provider.name;
    if (this.providers.has(key)) {
      console.log('Provider already registered:', key);
      return;
    }

    console.log('Registering class provider:', { key, value: provider.name });
    this.providers.set(key, provider);
    console.log('Current providers:', {
      keys: Array.from(this.providers.keys()),
      entries: Array.from(this.providers.entries()).map(([k, v]) => [
        k,
        v.name,
      ]),
    });
  }

  resolve<T>(token: Constructor<T>): T {
    const provider = this.providers.get(token.name);
    if (!provider) {
      throw new Error(`No provider found for ${token.name}`);
    }

    // Get constructor parameter types
    const paramTypes = Reflect.getMetadata('design:paramtypes', provider) || [];

    // Resolve dependencies recursively
    const dependencies = paramTypes.map((paramType: Constructor) => {
      return this.resolve(paramType);
    });

    return new provider(...dependencies);
  }
}
