import { Container } from './container';
import { Type } from './types';

export class ModuleLoader {
  constructor(private readonly container: Container) {}

  async getProvider<T>(token: Type<T> | string | symbol): Promise<T> {
    try {
      // Try to resolve from container first
      return await this.container.resolve(token as any);
    } catch (error) {
      // If it's a constructor and resolution fails, create a new instance
      if (typeof token === 'function') {
        return new token();
      }
      throw error;
    }
  }
}
