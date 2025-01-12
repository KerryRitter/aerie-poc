import * as React from 'react';
import { RemixBrowser } from '@remix-run/react';
import { hydrateRoot } from 'react-dom/client';
import { ModuleLoader } from '../core/module-loader';
import { ModuleLoaderProvider } from '../react/hooks';

type BootstrapOptions = {
  RootModule: new (...args: any[]) => any;
};

export async function hydrate(options: BootstrapOptions) {
  const moduleLoader = ModuleLoader.getInstance();
  await moduleLoader.bootstrapModule(options.RootModule);

  hydrateRoot(
    document,
    <ModuleLoaderProvider value={moduleLoader}>
      <RemixBrowser />
    </ModuleLoaderProvider>
  );
} 