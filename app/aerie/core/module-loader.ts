import { Container } from './container';
import type { Constructor } from './types';

export class ModuleLoader {
  constructor(private readonly container: Container) {}

  getProvider<T>(token: Constructor<T> | string | symbol): T {
    try {
      // Try to resolve from container first
      return this.container.resolve(token as any);
    } catch (error) {
      // If it's a constructor and resolution fails, create a new instance
      if (typeof token === 'function') {
        return new token();
      }
      throw error;
    }
  }
}
