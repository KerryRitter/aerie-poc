import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { matchPath } from '@remix-run/router';
import type { ReactElement } from 'react';
import * as React from 'react';
import { ModuleLoaderProvider } from '../react/hooks';
import { Container } from './container';
import { getParamsMetadata } from './decorators/http-params.decorator';
import { getControllerMetadata } from './decorators/http.decorator';
import type { RouteMetadata } from './decorators/types';
import { ModuleLoader } from './module-loader';
import type { Constructor } from './types';

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

type ViewRegistry = {
  [key: string]: React.ComponentType<any>;
};

export class Router {
  private static instance: Router;
  private readonly container: Container;
  private routeRegistry: Map<string, { controller: any; path: string }> =
    new Map();
  private viewRegistry: ViewRegistry = {};

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

    // Register view components if this is a view controller
    if (controllerMetadata.type === 'view') {
      for (const [_, routeMetadata] of controllerMetadata.routes) {
        if (routeMetadata.component) {
          const viewId = `${controllerMetadata.path}/${routeMetadata.path}`
            .replace(/\/+/g, '/')
            .replace(/^\/+|\/+$/g, '');
          this.viewRegistry[viewId] = () => routeMetadata.component!;
        }
      }
    }
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

  getRouteHandler(
    path: string,
    isApi: boolean = false
  ): ViewHandler | undefined {
    console.log('Getting route handler for path:', path);
    // For API routes, ensure path starts with api/
    const normalizedPath = isApi
      ? `api/${path}`.replace(/^api\/+/, 'api/').replace(/\/+$/, '')
      : path.replace(/^\/+|\/+$/g, '');

    for (const [name, route] of this.routeRegistry) {
      const metadata = getControllerMetadata(route.controller);
      if (!metadata || metadata.type !== (isApi ? 'api' : 'view')) continue;

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
        const fullPattern = ['', metadata.path, routeMetadata.path]
          .filter(Boolean)
          .join('/')
          .replace(/\/+/g, '/');

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

        // For API controllers, return the result directly
        if (metadata.type === 'api') {
          return json(result);
        }

        // For view controllers, return the result with a flag indicating which component to render
        return json({
          ...result,
          __viewId: `${metadata.path}/${routeMetadata.path}`
            .replace(/\/+/g, '/')
            .replace(/^\/+|\/+$/g, ''),
        });
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
        const fullPattern = ['', metadata.path, routeMetadata.path]
          .filter(Boolean)
          .join('/')
          .replace(/\/+/g, '/');

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

        // For API controllers, return the result directly
        if (metadata.type === 'api') {
          return json(result);
        }

        // For view controllers, return the result with a flag indicating which component to render
        return json({
          ...result,
          __viewId: `${metadata.path}/${routeMetadata.path}`
            .replace(/\/+/g, '/')
            .replace(/^\/+|\/+$/g, ''),
        });
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

  createRemixApiRoute() {
    return {
      loader: async (args: LoaderFunctionArgs) => {
        const path = args.params['*'] || '';
        const handler = this.getRouteHandler(path, true);
        if (!handler) return null;
        return handler.loader(args);
      },
      action: async (args: ActionFunctionArgs) => {
        const path = args.params['*'] || '';
        const handler = this.getRouteHandler(path, true);
        if (!handler) return null;
        return handler.action(args);
      },
    };
  }

  createRemixViewRoute() {
    const router = this;
    const moduleLoader = new ModuleLoader(this.container);

    const CatchAllRoute: React.FC = () => {
      const data = useLoaderData<{ __viewId?: string }>();
      const Component = data.__viewId
        ? router.viewRegistry[data.__viewId]
        : null;

      return React.createElement(
        ModuleLoaderProvider,
        { value: moduleLoader },
        Component ? React.createElement(Component) : null
      );
    };

    return {
      loader: async (args: LoaderFunctionArgs) => {
        const path = args.params['*'] || '';
        const handler = this.getRouteHandler(path, false);
        if (!handler) return null;
        return handler.loader(args);
      },
      action: async (args: ActionFunctionArgs) => {
        const path = args.params['*'] || '';
        const handler = this.getRouteHandler(path, false);
        if (!handler) return null;
        return handler.action(args);
      },
      Component: CatchAllRoute,
    };
  }
}
