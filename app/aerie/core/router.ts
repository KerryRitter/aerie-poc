import type {
  LoaderFunction,
  ActionFunction,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { json } from '@remix-run/node';
import { matchPath } from '@remix-run/router';
import { Container } from './container';
import { getControllerMetadata } from './decorators/http.decorator';
import { getParamsMetadata } from './decorators/http-params.decorator';
import {
  getHttpCodeMetadata,
  getHeadersMetadata,
} from './decorators/http-response.decorator';
import { MODULE_METADATA_KEY } from './decorators/module.decorator';
import { getInjectMetadata } from './decorators/injectable.decorator';
import { getEnvironmentMetadata } from './environment/decorators';
import type { ReactElement } from 'react';
import type { Constructor } from './types';
import type { RouteMetadata } from './decorators/types';

type ModuleRoute = {
  path: string;
  layout: string;
  children: Array<{
    path: string;
    component: ReactElement | string | null;
    options?: { index?: boolean };
    routeFile?: string;
  }>;
};

type ViewHandler = {
  loader: LoaderFunction;
  action: ActionFunction;
};

export class Router {
  private static instance: Router;
  private readonly container: Container;
  private routeRegistry: Map<string, { controller: any; path: string }> =
    new Map();

  private constructor() {
    this.container = Container.getInstance();
  }

  static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  getContainer(): Container {
    return this.container;
  }

  registerController(controllerClass: Constructor) {
    const controllerMetadata = getControllerMetadata(controllerClass);
    if (!controllerMetadata) {
      console.log('No controller metadata for:', controllerClass.name);
      return;
    }

    console.log('Registering controller:', {
      name: controllerClass.name,
      path: controllerMetadata.path,
      metadata: controllerMetadata,
    });

    this.routeRegistry.set(controllerClass.name, {
      controller: controllerClass,
      path: controllerMetadata.path,
    });
  }

  getModuleRoutes(): ModuleRoute[] {
    const routes: ModuleRoute[] = [];

    for (const [controllerName, { controller, path }] of this.routeRegistry) {
      const metadata = getControllerMetadata(controller);
      if (!metadata) continue;

      const modulePath = path.replace(/^\//, '');
      const route: ModuleRoute = {
        path: modulePath,
        layout: `${modulePath}/layout.tsx`,
        children: [],
      };

      route.children.push({
        path: '',
        component: `${modulePath}/route.tsx`,
        options: { index: true },
      });

      for (const [, routeMetadata] of metadata.routes) {
        if (routeMetadata.path && routeMetadata.path !== '/') {
          route.children.push({
            path: routeMetadata.path.replace(/^\//, ''),
            component: `${modulePath}/${routeMetadata.path.replace(/^\//, '')}.tsx`,
          });
        }
      }

      routes.push(route);
    }

    return routes;
  }

  getRouteHandler(path: string): ViewHandler | undefined {
    console.log('Getting route handler for path:', path);
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');

    for (const [name, route] of this.routeRegistry) {
      const normalizedRoutePath = route.path.replace(/^\/+|\/+$/g, '');
      console.log('Checking HTTP route:', {
        name,
        routePath: normalizedRoutePath,
        requestPath: normalizedPath,
        isMatch: normalizedPath.startsWith(normalizedRoutePath),
      });

      if (normalizedPath.startsWith(normalizedRoutePath)) {
        console.log('Found matching HTTP route:', name);
        return this.createRouteHandler(route.controller);
      }
    }

    return undefined;
  }

  private createRouteHandler(controllerClass: Constructor): ViewHandler {
    const metadata = getControllerMetadata(controllerClass);
    if (!metadata) {
      throw new Error(`${controllerClass.name} is not a valid controller`);
    }

    const controller = this.container.resolve(controllerClass) as Record<
      string | symbol,
      Function
    >;

    return {
      loader: async ({ request, params }: LoaderFunctionArgs) => {
        const url = new URL(request.url);
        const path =
          url.pathname.replace(metadata.path, '').replace(/^\/+|\/+$/g, '') ||
          '/';
        console.log('Loader path matching:', {
          url: url.pathname,
          controllerPath: metadata.path,
          matchPath: path,
        });

        const entries = Array.from(metadata.routes.entries()) as Array<
          [string | symbol, RouteMetadata]
        >;
        const methodEntry = entries.find(([_, route]) => {
          const matches =
            route.method === 'GET' && this.matchRoute(route.path || '/', path);
          console.log('Checking route match:', {
            method: route.method,
            routePath: route.path || '/',
            requestPath: path,
            matches,
          });
          return matches;
        });

        if (!methodEntry) {
          console.log('No matching GET route found');
          return null;
        }

        const [method, routeMetadata] = methodEntry;
        console.log('Found matching route:', {
          method: String(method),
          metadata: routeMetadata,
        });

        const handlerFn = controller[method as string];
        if (!handlerFn) {
          throw new Error('No GET handler method found');
        }

        // Parse params using matchPath
        const fullPattern = `/${metadata.path}${routeMetadata.path.startsWith('/') ? '' : '/'}${routeMetadata.path}`;
        console.log('Matching full pattern:', {
          pattern: fullPattern,
          pathname: url.pathname,
        });
        const match = matchPath({ path: fullPattern, end: true }, url.pathname);
        console.log('Match result:', match);

        const paramMetadata = getParamsMetadata(controller, method);
        const args = await Promise.all(
          paramMetadata.map(async (param) => {
            switch (param.type) {
              case 'PARAM':
                return param.data ? match?.params[param.data] || null : null;
              case 'QUERY':
                return param.data
                  ? url.searchParams.get(param.data)
                  : Object.fromEntries(url.searchParams);
              default:
                return undefined;
            }
          })
        );

        const result = await Reflect.apply(handlerFn, controller, args);

        if (routeMetadata.isJson) {
          const statusCode = getHttpCodeMetadata(controller, method) || 200;
          const headers = getHeadersMetadata(controller, method);
          return json(result, { status: statusCode, headers });
        }

        return result;
      },
      action: async ({ request, params }: ActionFunctionArgs) => {
        const url = new URL(request.url);
        const path =
          url.pathname.replace(metadata.path, '').replace(/^\/+|\/+$/g, '') ||
          '/';

        const entries = Array.from(metadata.routes.entries()) as Array<
          [string | symbol, RouteMetadata]
        >;
        const methodEntry = entries.find(([_, route]) => {
          return (
            route.method === request.method &&
            this.matchRoute(route.path || '/', path)
          );
        });

        if (!methodEntry) {
          throw new Error(`No matching ${request.method} handler found`);
        }

        const [method, routeMetadata] = methodEntry;
        const handlerFn = controller[method as string];
        if (!handlerFn) {
          throw new Error(`No ${request.method} handler method found`);
        }

        // Parse params using matchPath
        const fullPattern = `/${metadata.path}${routeMetadata.path.startsWith('/') ? '' : '/'}${routeMetadata.path}`;
        console.log('Matching full pattern:', {
          pattern: fullPattern,
          pathname: url.pathname,
        });
        const match = matchPath({ path: fullPattern, end: true }, url.pathname);
        console.log('Match result:', match);

        const paramMetadata = getParamsMetadata(controller, method);
        const args = await Promise.all(
          paramMetadata.map(async (param) => {
            switch (param.type) {
              case 'PARAM':
                return param.data ? match?.params[param.data] || null : null;
              case 'BODY':
                return request.json();
              case 'QUERY':
                return param.data
                  ? url.searchParams.get(param.data)
                  : Object.fromEntries(url.searchParams);
              default:
                return undefined;
            }
          })
        );

        const result = await Reflect.apply(handlerFn, controller, args);

        if (routeMetadata.isJson) {
          const statusCode = getHttpCodeMetadata(controller, method) || 200;
          const headers = getHeadersMetadata(controller, method);
          return json(result, { status: statusCode, headers });
        }

        return result;
      },
    };
  }

  private matchRoute(pattern: string, path: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/:[^\s/]+/g, '([^/]+)').replace(/\/$/, '') + '/?$'
    );
    console.log('Route matching:', {
      pattern,
      path,
      regex: regex.toString(),
      matches: regex.test(path),
    });
    return regex.test(path);
  }

  createRemixRoute() {
    return {
      loader: async (args: LoaderFunctionArgs) => {
        const handler = this.getRouteHandler(args.params['*'] || '');
        if (!handler) return null;
        return handler.loader(args);
      },
      action: async (args: ActionFunctionArgs) => {
        const handler = this.getRouteHandler(args.params['*'] || '');
        if (!handler) return null;
        return handler.action(args);
      },
      // Component: () => null,
    };
  }
}
