import type { LoaderFunction, ActionFunction, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { json } from '@remix-run/node';
import { Container } from './container';
import { getControllerMetadata } from './decorators/http.decorator';
import { getParamsMetadata } from './decorators/http-params.decorator';
import { getHttpCodeMetadata, getHeadersMetadata, getRedirectMetadata } from './decorators/http-response.decorator';
import { MODULE_METADATA_KEY } from './decorators/module.decorator';
import { getInjectMetadata } from './decorators/injectable.decorator';
import { getEnvironmentMetadata } from './environment/decorators';
import type { ReactElement } from 'react';
import type { Constructor } from './types';
import type { RouteMetadata } from './decorators/types';

type HttpContext = {
  request: Request;
  params: Params;
};

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
  private routeRegistry: Map<string, { controller: any; path: string }> = new Map();

  private constructor() {
    this.container = Container.getInstance();
  }

  static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  registerModuleRoutes(moduleClass: Constructor) {
    const metadata = Reflect.getMetadata(MODULE_METADATA_KEY, moduleClass);
    console.log('Registering module:', {
      moduleClass: moduleClass.name,
      metadata: {
        ...metadata,
        providers: metadata?.providers?.map((p: Constructor) => ({
          name: p.name,
          isClass: typeof p === 'function',
          constructorString: p.toString(),
          paramTypes: Reflect.getMetadata('design:paramtypes', p)?.map((t: Constructor) => t?.name),
          injectMetadata: getInjectMetadata(p),
          envMetadata: getEnvironmentMetadata(p)
        })),
        controllers: metadata?.controllers?.map((c: Constructor) => c.name)
      }
    });
    
    // Register providers first
    if (metadata?.providers) {
      console.log('Raw providers:', metadata.providers);
      for (const provider of metadata.providers) {
        console.log('Registering provider:', {
          name: provider.name,
          isClass: typeof provider === 'function',
          provider,
          constructorString: provider.toString(),
          paramTypes: Reflect.getMetadata('design:paramtypes', provider)?.map((t: Constructor) => t?.name),
          injectMetadata: getInjectMetadata(provider),
          envMetadata: getEnvironmentMetadata(provider)
        });
        this.container.register(provider);
      }
    }
    
    // Register HTTP controllers
    if (metadata?.controllers) {
      for (const controllerClass of metadata.controllers) {
        const controllerMetadata = getControllerMetadata(controllerClass);
        if (!controllerMetadata) {
          console.log('No controller metadata for:', controllerClass.name);
          continue;
        }

        console.log('Registering controller:', {
          name: controllerClass.name,
          path: controllerMetadata.path,
          metadata: controllerMetadata
        });

        // Register the controller as a provider
        this.container.register(controllerClass);
        this.routeRegistry.set(controllerClass.name, {
          controller: controllerClass,
          path: controllerMetadata.path,
        });
      }
    }
  }

  getModuleRoutes(): ModuleRoute[] {
    const routes: ModuleRoute[] = [];

    // Process HTTP controllers
    for (const [controllerName, { controller, path }] of this.routeRegistry) {
      const metadata = getControllerMetadata(controller);
      if (!metadata) continue;

      const modulePath = path.replace(/^\//, '');
      const route: ModuleRoute = {
        path: modulePath,
        layout: `${modulePath}/layout.tsx`,
        children: []
      };

      // Add index route
      route.children.push({
        path: '',
        component: `${modulePath}/route.tsx`,
        options: { index: true }
      });

      // Add dynamic routes
      for (const [, routeMetadata] of metadata.routes) {
        if (routeMetadata.path && routeMetadata.path !== '/') {
          route.children.push({
            path: routeMetadata.path.replace(/^\//, ''),
            component: `${modulePath}/${routeMetadata.path.replace(/^\//, '')}.tsx`
          });
        }
      }

      routes.push(route);
    }

    return routes;
  }

  getRouteHandler(path: string): ViewHandler | undefined {
    console.log('Getting route handler for path:', path);

    // Normalize paths for comparison
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');

    // Check HTTP controllers
    for (const [name, route] of this.routeRegistry) {
      const normalizedRoutePath = route.path.replace(/^\/+|\/+$/g, '');
      console.log('Checking HTTP route:', { 
        name, 
        routePath: normalizedRoutePath, 
        requestPath: normalizedPath,
        isMatch: normalizedPath === normalizedRoutePath 
      });
      
      if (normalizedPath === normalizedRoutePath) {
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

    const controller = this.container.resolve(controllerClass) as Record<string | symbol, Function>;

    return {
      loader: async (args: LoaderFunctionArgs) => {
        const entries = Array.from(metadata.routes.entries()) as Array<[string | symbol, RouteMetadata]>;
        const methodEntry = entries.find(([_, route]) => route.method === 'GET');
        const method = methodEntry?.[0];

        if (!method) {
          throw new Error('No GET handler found');
        }

        const handlerFn = Reflect.get(controller, method);
        if (!handlerFn) {
          throw new Error('No GET handler method found');
        }

        const result = await Reflect.apply(handlerFn, controller, [args]);
        const routeMetadata = metadata.routes.get(method);
        
        // If this is a JSON endpoint, wrap the response in json()
        if (routeMetadata?.isJson) {
          return json(result);
        }
        
        return result;
      },
      action: async (args: ActionFunctionArgs) => {
        const entries = Array.from(metadata.routes.entries()) as Array<[string | symbol, RouteMetadata]>;
        const methodEntry = entries.find(([_, route]) => route.method !== 'GET');
        const method = methodEntry?.[0];

        if (!method) {
          throw new Error('No non-GET handler found');
        }

        const handlerFn = Reflect.get(controller, method);
        if (!handlerFn) {
          throw new Error('No non-GET handler method found');
        }

        const result = await Reflect.apply(handlerFn, controller, [args]);
        const routeMetadata = metadata.routes.get(method);
        
        // If this is a JSON endpoint, wrap the response in json()
        if (routeMetadata?.isJson) {
          return json(result);
        }
        
        return result;
      }
    };
  }

  private async executeHandler(
    controller: any,
    methodName: string | symbol,
    context: HttpContext
  ) {
    const params = getParamsMetadata(controller, methodName);
    const args = await Promise.all(
      params.map(async param => {
        switch (param.type) {
          case 'PARAM':
            return param.data ? context.params[param.data] || null : null;
          case 'BODY':
            return context.request.json();
          case 'QUERY':
            const url = new URL(context.request.url);
            return param.data 
              ? url.searchParams.get(param.data)
              : Object.fromEntries(url.searchParams);
          case 'HEADERS':
            return param.data
              ? context.request.headers.get(param.data)
              : Object.fromEntries(context.request.headers);
          default:
            return undefined;
        }
      })
    );

    return controller[methodName as string](...args);
  }

  private createResponse(result: any, controller: any, methodName: string | symbol) {
    const statusCode = getHttpCodeMetadata(controller, methodName) || 200;
    const headers = getHeadersMetadata(controller, methodName);
    const redirect = getRedirectMetadata(controller, methodName);

    if (redirect) {
      return new Response(null, {
        status: redirect.statusCode,
        headers: { Location: redirect.url, ...headers }
      });
    }

    return json(result, {
      status: statusCode,
      headers
    });
  }

  private matchRoute(pattern: string, path: string): boolean {
    // Convert route pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/:[^\s/]+/g, '([^/]+)') + '$'
    );
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
      Component: () => null
    };
  }
} 