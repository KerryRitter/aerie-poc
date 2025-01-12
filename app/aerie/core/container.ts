import { Constructor } from './types';
import { getInjectMetadata } from './decorators/injectable.decorator';
import { getEnvironmentMetadata } from './environment/decorators';
import { getCurrentEnvironment, EnvironmentError } from './environment/types';

type Token<T> = Constructor<T> | string | symbol;
type Provider = Constructor | { provide: any; useClass: Constructor; useValue?: any };

export class Container {
  private static instance: Container;
  private providers = new Map<any, Provider>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(provider: Provider) {
    console.log('Container registering provider:', {
      provider,
      isClass: this.isClassProvider(provider),
      token: this.getProviderToken(provider),
      providerName: this.isClassProvider(provider) ? provider.name : provider.provide.name,
      constructorString: provider.toString()
    });

    // Store both the class reference and the provider
    if (this.isClassProvider(provider)) {
      console.log('Registering class provider:', {
        key: provider.name,
        value: provider.name
      });
      // Store it both by the class itself and its name
      this.providers.set(provider, provider);
      this.providers.set(provider.name, provider);
    } else {
      console.log('Registering value provider:', {
        key: provider.provide.name,
        value: provider.useClass?.name || provider.useValue
      });
      this.providers.set(provider.provide, provider);
    }

    // Log current state
    console.log('Current providers:', {
      keys: Array.from(this.providers.keys()).map(k => 
        typeof k === 'function' ? k.name : String(k)
      ),
      entries: Array.from(this.providers.entries()).map(([k, v]) => [
        typeof k === 'function' ? k.name : String(k),
        this.isClassProvider(v) ? v.name : v.provide.name
      ])
    });
  }

  resolve<T>(token: Token<T>): T {
    console.log('Container resolving token:', {
      token: typeof token === 'function' ? token.name : String(token),
      tokenType: typeof token,
      providers: Array.from(this.providers.keys()).map(k => 
        typeof k === 'function' ? k.name : String(k)
      )
    });

    // Try to find the provider by the token directly
    let provider = this.providers.get(token);

    // If not found and token is a string, try to find by class name
    if (!provider && typeof token === 'string') {
      provider = Array.from(this.providers.values()).find(p => 
        this.isClassProvider(p) && p.name === token
      );
    }

    if (!provider) {
      console.error('No provider found for token:', {
        token: typeof token === 'function' ? token.name : String(token),
        tokenType: typeof token,
        availableProviders: Array.from(this.providers.keys()).map(k => 
          typeof k === 'function' ? k.name : String(k)
        )
      });
      throw new Error(`No provider found for ${typeof token === 'function' ? token.name : String(token)}`);
    }

    console.log('Found provider:', {
      provider,
      isClass: this.isClassProvider(provider)
    });

    if (this.isClassProvider(provider)) {
      // Check environment restrictions
      const envMetadata = getEnvironmentMetadata(provider);
      if (envMetadata) {
        const currentEnv = getCurrentEnvironment();
        if (currentEnv !== envMetadata.restrictTo) {
          throw envMetadata.restrictTo === 'server'
            ? EnvironmentError.createServerOnlyError(provider.name)
            : EnvironmentError.createClientOnlyError(provider.name);
        }
      }

      const paramTypes = Reflect.getMetadata('design:paramtypes', provider) || [];
      const injectMetadata = getInjectMetadata(provider) || {};
      
      console.log('Class provider param types:', {
        class: provider.name,
        paramTypes: paramTypes.map((t: Constructor<unknown>) => t?.name || String(t)),
        injectMetadata
      });

      const params = paramTypes.map((type: Constructor<unknown>, index: number) => {
        // Use inject metadata if available, otherwise use the parameter type
        const injectToken = injectMetadata[index] || type;
        return this.resolve(injectToken);
      });
      
      return new provider(...params);
    }

    if (provider.useClass) {
      // Check environment restrictions
      const envMetadata = getEnvironmentMetadata(provider.useClass);
      if (envMetadata) {
        const currentEnv = getCurrentEnvironment();
        if (currentEnv !== envMetadata.restrictTo) {
          throw envMetadata.restrictTo === 'server'
            ? EnvironmentError.createServerOnlyError(provider.useClass.name)
            : EnvironmentError.createClientOnlyError(provider.useClass.name);
        }
      }

      const paramTypes = Reflect.getMetadata('design:paramtypes', provider.useClass) || [];
      const injectMetadata = getInjectMetadata(provider.useClass) || {};
      
      console.log('UseClass provider param types:', {
        class: provider.useClass.name,
        paramTypes: paramTypes.map((t: Constructor<unknown>) => t?.name || String(t)),
        injectMetadata
      });

      const params = paramTypes.map((type: Constructor<unknown>, index: number) => {
        // Use inject metadata if available, otherwise use the parameter type
        const injectToken = injectMetadata[index] || type;
        return this.resolve(injectToken);
      });
      
      return new provider.useClass(...params);
    }

    return provider.useValue;
  }

  private isClassProvider(provider: Provider): provider is Constructor {
    return typeof provider === 'function';
  }

  private getProviderToken(provider: Provider): any {
    return this.isClassProvider(provider) ? provider : provider.provide;
  }
} 