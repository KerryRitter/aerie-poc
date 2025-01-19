import { useContext, createContext } from 'react';
import type { ModuleLoader } from '../core/module-loader';

const ModuleLoaderContext = createContext<ModuleLoader | null>(null);

export const ModuleLoaderProvider = ModuleLoaderContext.Provider;

export function useModuleLoader() {
  const loader = useContext(ModuleLoaderContext);
  if (!loader) {
    throw new Error(
      'useModuleLoader must be used within a ModuleLoaderProvider'
    );
  }
  return loader;
}

export function useProvider<T>(token: new (...args: any[]) => T): T;
export function useProvider<T>(token: string | symbol): T;
export async function useProvider<T>(token: any): Promise<T> {
  const loader = useModuleLoader();
  return await loader.getProvider<T>(token);
}
