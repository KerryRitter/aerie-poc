import 'reflect-metadata';
import * as React from 'react';
import type { EntryContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';
import { ModuleLoader } from '../core/module-loader';
import { ModuleLoaderProvider } from '../react/hooks';

type BootstrapOptions = {
  RootModule: new (...args: any[]) => any;
};

export async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  options: BootstrapOptions
) {
  const moduleLoader = ModuleLoader.getInstance();
  await moduleLoader.bootstrapModule(options.RootModule);

  const markup = renderToString(
    <ModuleLoaderProvider value={moduleLoader}>
      <RemixServer context={remixContext} url={request.url} />
    </ModuleLoaderProvider>
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response('<!DOCTYPE html>' + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
} 