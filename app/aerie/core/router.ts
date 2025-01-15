import { AerieConfig } from './aerie-config';
import { PipeTransform } from './pipes';
import {
  Middleware,
  NextFunction,
  Type,
  Guard,
  ExecutionContext,
  Interceptor,
} from './types';
import {
  MIDDLEWARE_METADATA,
  ROUTES_METADATA,
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
} from './reflect';
import { ReactElement } from 'react';
import { LoaderFunction, ActionFunction, redirect } from '@remix-run/node';
import { Container } from './container';
import * as React from 'react';
import { useLocation } from '@remix-run/react';
import { useLoaderData } from '@remix-run/react';
import { ModuleLoaderProvider } from '../react/hooks';
import { ModuleLoader } from './module-loader';
import { getControllerMetadata } from './decorators/http.decorator';
import { matchPath } from '@remix-run/router';

type RouteParam = {
  name: string;
  type: Type;
  pipes: PipeTransform[];
};

type ViewRoute = {
  type: 'view';
  path: string;
  controller: Type;
  component: ReactElement | null;
  methodName?: string;
};

type ApiRoute = {
  type: 'api';
  path: string;
  method: string;
  controller: Type;
  methodName: string;
  params: RouteParam[];
};

type ViewHandler = {
  loader: LoaderFunction;
  action: ActionFunction;
};

type ViewRegistry = {
  [key: string]: React.ComponentType<any>;
};

type Route = ApiRoute | ViewRoute;

export class Router {
  private static instance: Router;
  private viewRoutes: ViewRoute[] = [];
  private apiRoutes: ApiRoute[] = [];
  private viewHandlers: Map<string, ViewHandler> = new Map();
  private viewRegistry: ViewRegistry = {};
  private readonly container: Container;
  private globalMiddleware: Middleware[] = [];
  private globalGuards: Guard[] = [];
  private globalInterceptors: Interceptor[] = [];

  private constructor(private readonly config: AerieConfig) {
    this.container = Container.getInstance();
  }

  static getInstance(config: AerieConfig): Router {
    if (!Router.instance) {
      Router.instance = new Router(config);
    }
    return Router.instance;
  }

  getContainer(): Container {
    return this.container;
  }

  async handleRequest(request: Request, response: Response) {
    const url = new URL(request.url);
    console.log('Handling request:', {
      url: url.toString(),
      method: request.method,
    });

    const route = this.findMatchingRoute(url.pathname, request.method);
    console.log('Found route:', route);

    if (!route) {
      console.log('No route found');
      return null;
    }

    const params: any[] = []; // You'll need to implement param extraction based on your needs

    if ('method' in route) {
      console.log('Handling as API route');
      return this.handleApiRoute(request, response, route, params);
    } else {
      console.log('Handling as view route');
      return this.handleViewRoute(request, response, route, params);
    }
  }

  private findMatchingRoute(
    path: string,
    method: string
  ): ApiRoute | ViewRoute | undefined {
    console.log('Finding route for:', { path, method });
    console.log('Available routes:', {
      api: this.apiRoutes,
      view: this.viewRoutes,
    });

    // Try to find matching API route first
    const apiRoute = this.apiRoutes.find((r) => {
      const match = matchPath({ path: r.path, end: true }, path);
      return match && r.method === method;
    });

    if (apiRoute) {
      console.log('Found API route:', apiRoute);
      return apiRoute;
    }

    // Then try to find matching view route
    const viewRoute = this.viewRoutes.find((r) => {
      const match = matchPath({ path: r.path, end: true }, path);
      return match;
    });

    console.log('Found view route:', viewRoute);
    return viewRoute;
  }

  private async handleApiRoute(
    request: Request,
    response: Response,
    route: ApiRoute,
    params: any[]
  ) {
    const controller = this.container.resolve(route.controller);
    const result = await this.processRequest(
      request,
      response,
      controller,
      route.methodName,
      params
    );
    return result;
  }

  private async handleViewRoute(
    request: Request,
    response: Response,
    route: ViewRoute,
    params: any[]
  ) {
    console.log('handleViewRoute:', { route });

    if (!route.methodName) {
      console.log('No methodName');
      return null;
    }

    const controller = this.container.resolve(route.controller);
    console.log('Resolved controller:', controller);

    const result = await this.processRequest(
      request,
      response,
      controller,
      route.methodName,
      params
    );
    console.log('Controller result:', result);

    // For view controllers, return the result with the viewId and component
    const viewId = `${route.path}/${route.methodName}`
      .replace(/\/+/g, '/')
      .replace(/^\/+|\/+$/g, '');
    console.log('Generated viewId:', viewId);

    const finalResult = {
      ...result,
      __viewId: viewId,
      __component: route.component,
    };
    console.log('Final result:', finalResult);
    return finalResult;
  }

  private async processRequest(
    request: Request,
    response: Response,
    target: any,
    methodName: string,
    params: any[]
  ) {
    // Check guards first
    const guards = this.getGuards(target.constructor, methodName);
    const context: ExecutionContext = {
      request,
      response,
      type:
        this.findMatchingRoute(new URL(request.url).pathname, request.method)
          ?.type === 'api'
          ? 'api'
          : 'view',
    };

    for (const guard of guards) {
      const canActivate = await guard.canActivate(context);
      if (!canActivate) {
        if (context.type === 'api') {
          return { statusCode: 401, message: 'Unauthorized' };
        } else {
          throw redirect(this.config.viewGuardRedirect || 'auth/login');
        }
      }
    }

    // Then process middleware and interceptors
    const middleware = this.getMiddleware(target.constructor, methodName);
    const interceptors = this.getInterceptors(target.constructor, methodName);

    // Create the final handler that includes middleware and the actual method
    const handler = async () => {
      return this.executeMiddleware(middleware, request, response, () =>
        target[methodName].apply(target, params)
      );
    };

    // Chain interceptors
    const chainedHandler = interceptors.reduceRight(
      (next, interceptor) => ({
        handle: () => interceptor.intercept(context, next),
      }),
      { handle: handler }
    );

    return chainedHandler.handle();
  }

  private getGuards(target: any, methodName?: string): Guard[] {
    const classGuards: Guard[] =
      Reflect.getMetadata(GUARDS_METADATA, target) || [];
    const methodGuards: Guard[] = methodName
      ? Reflect.getMetadata(GUARDS_METADATA, target, methodName) || []
      : [];

    return [...this.globalGuards, ...classGuards, ...methodGuards];
  }

  private getMiddleware(target: any, methodName?: string): Middleware[] {
    const classMiddleware: Middleware[] =
      Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
    const methodMiddleware: Middleware[] = methodName
      ? Reflect.getMetadata(MIDDLEWARE_METADATA, target, methodName) || []
      : [];

    return [...this.globalMiddleware, ...classMiddleware, ...methodMiddleware];
  }

  private executeMiddleware(
    middleware: Middleware[],
    request: Request,
    response: Response,
    handler: () => Promise<any>
  ): Promise<any> {
    // If no middleware, just run the handler
    if (middleware.length === 0) {
      return handler();
    }

    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= middleware.length) {
        return handler();
      }

      const current = middleware[index++];

      if (typeof current === 'function') {
        return current(request, response, next);
      } else {
        return current.use(request, response, next);
      }
    };

    return next();
  }

  private getInterceptors(target: any, methodName?: string): Interceptor[] {
    const classInterceptors: Interceptor[] =
      Reflect.getMetadata(INTERCEPTORS_METADATA, target) || [];
    const methodInterceptors: Interceptor[] = methodName
      ? Reflect.getMetadata(INTERCEPTORS_METADATA, target, methodName) || []
      : [];

    return [
      ...this.globalInterceptors,
      ...classInterceptors,
      ...methodInterceptors,
    ];
  }

  registerController(controllerClass: Type) {
    const metadata = getControllerMetadata(controllerClass);
    if (!metadata) {
      console.log('No controller metadata for:', controllerClass.name);
      return;
    }

    console.log('Registering controller:', {
      name: controllerClass.name,
      path: metadata.path,
      metadata: metadata,
    });

    if (metadata.type === 'api') {
      // Register API routes
      for (const [methodName, routeMetadata] of metadata.routes.entries()) {
        if (typeof methodName === 'string') {
          this.addApiRoute(
            metadata.path + (routeMetadata.path || ''),
            routeMetadata.method || 'GET',
            controllerClass,
            methodName,
            [] // We'll need to implement param extraction
          );
        }
      }
    } else if (metadata.type === 'view') {
      // Register view routes and components
      for (const [methodName, routeMetadata] of metadata.routes.entries()) {
        if (typeof methodName === 'string') {
          // Add to viewRoutes for routing
          this.addViewRoute(
            metadata.path,
            controllerClass,
            routeMetadata.component || null,
            methodName
          );

          // Add to viewRegistry for component lookup
          if (routeMetadata.component) {
            // Use the same format as handleViewRoute: path/methodName
            const viewId = `${metadata.path}/${methodName}`
              .replace(/\/+/g, '/')
              .replace(/^\/+|\/+$/g, '');
            console.log('Registering component with viewId:', viewId);
            this.viewRegistry[viewId] = () => routeMetadata.component!;
          }
        }
      }
    }
  }

  private addApiRoute(
    path: string,
    method: string,
    controller: Type,
    methodName: string,
    params: RouteParam[]
  ) {
    this.apiRoutes.push({
      type: 'api',
      path,
      method,
      controller,
      methodName,
      params,
    });
  }

  private addViewRoute(
    path: string,
    controller: Type,
    component: ReactElement | null,
    methodName: string | undefined
  ) {
    this.viewRoutes.push({
      type: 'view',
      path,
      controller,
      component,
      methodName,
    });
  }

  private registerModule(module: any) {
    const routes: Route[] = Reflect.getMetadata(ROUTES_METADATA, module) || [];

    for (const route of routes) {
      if (route.type === 'api') {
        this.addApiRoute(
          route.path,
          route.method,
          route.controller,
          route.methodName,
          route.params || []
        );
      } else if (route.type === 'view') {
        this.addViewRoute(
          route.path,
          route.controller,
          route.component,
          route.methodName
        );
      }
    }
  }

  createRemixApiRoute() {
    return {
      loader: async ({
        request,
        params,
      }: {
        request: Request;
        params: any;
      }) => {
        const response = new Response();
        const result = await this.handleRequest(request, response);
        return result;
      },
      action: async ({
        request,
        params,
      }: {
        request: Request;
        params: any;
      }) => {
        const response = new Response();
        const result = await this.handleRequest(request, response);
        return result;
      },
    };
  }

  createRemixViewRoute() {
    const moduleLoader = new ModuleLoader(this.container);
    console.log('View Registry:', this.viewRegistry);

    const CatchAllRoute: React.FC = () => {
      const data = useLoaderData<{
        __viewId?: string;
        __component?: ReactElement;
      }>();
      console.log('Loader data:', data);

      if (!data) {
        console.log('No loader data');
        return null;
      }

      const Component = data.__component || null;
      console.log('Found component:', { viewId: data.__viewId, Component });

      return React.createElement(
        ModuleLoaderProvider,
        { value: moduleLoader },
        Component
      );
    };

    return {
      loader: async ({
        request,
        params,
      }: {
        request: Request;
        params: any;
      }) => {
        console.log('View loader called:', { url: request.url, params });
        const response = new Response();
        const result = await this.handleRequest(request, response);
        console.log('View loader result:', result);
        if (!result) return null;
        return result;
      },
      action: async ({
        request,
        params,
      }: {
        request: Request;
        params: any;
      }) => {
        const response = new Response();
        const result = await this.handleRequest(request, response);
        if (!result) return null;
        return result;
      },
      Component: CatchAllRoute,
    };
  }

  useGlobalMiddleware(middleware: Type<Middleware>) {
    const instance = this.container.resolve(middleware) as Middleware;
    this.globalMiddleware.push(instance);
    return this;
  }

  useGlobalGuards(guard: Type<Guard>) {
    const instance = this.container.resolve(guard) as Guard;
    this.globalGuards.push(instance);
    return this;
  }

  useGlobalInterceptors(interceptor: Type<Interceptor>) {
    const instance = this.container.resolve(interceptor) as Interceptor;
    this.globalInterceptors.push(instance);
    return this;
  }
}
