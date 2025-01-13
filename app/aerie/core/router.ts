import { AerieConfig } from './aerie-config';
import { PipeTransform } from './pipes';
import { Middleware, NextFunction, Type } from './types';
import { MIDDLEWARE_METADATA, ROUTES_METADATA } from './reflect';
import { ReactElement } from 'react';
import { LoaderFunction, ActionFunction } from '@remix-run/node';
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
  path: string;
  layout: string;
  controller?: Type;
  methodName?: string;
  children: Array<{
    path: string;
    component: ReactElement | string | null;
    options?: { index?: boolean };
    routeFile?: string;
  }>;
};

type ApiRoute = {
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

type Route = {
  type: 'api' | 'view';
  path: string;
  method?: string;
  controller: Type;
  methodName: string;
  params?: RouteParam[];
  layout?: string;
  children?: Array<{
    path: string;
    component: ReactElement | string | null;
    options?: { index?: boolean };
    routeFile?: string;
  }>;
};

export class Router {
  private static instance: Router;
  private viewRoutes: ViewRoute[] = [];
  private apiRoutes: ApiRoute[] = [];
  private viewHandlers: Map<string, ViewHandler> = new Map();
  private viewRegistry: ViewRegistry = {};
  private readonly container: Container;

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

    // Try to find matching API route
    const apiRoute = this.apiRoutes.find((r) => {
      const match = matchPath({ path: r.path, end: true }, path);
      return match && r.method === method;
    });

    if (apiRoute) {
      console.log('Found API route:', apiRoute);
      return apiRoute;
    }

    // Try to find matching view route
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

    if (!route.controller || !route.methodName) {
      console.log('No controller or methodName');
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

    // For view controllers, return the result with the viewId
    const viewId = `${route.path}/${route.methodName}`
      .replace(/\/+/g, '/')
      .replace(/^\/+|\/+$/g, '');
    console.log('Generated viewId:', viewId);

    const finalResult = {
      ...result,
      __viewId: viewId,
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
    const middleware = this.getMiddleware(target.constructor, methodName);

    // Create handler function that will be called after middleware
    const handler = async () => {
      return target[methodName].apply(target, params);
    };

    // Execute middleware chain with handler
    return this.executeMiddleware(middleware, request, response, handler);
  }

  private getMiddleware(target: any, methodName?: string): Middleware[] {
    const classMiddleware: Middleware[] =
      Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
    const methodMiddleware: Middleware[] = methodName
      ? Reflect.getMetadata(MIDDLEWARE_METADATA, target, methodName) || []
      : [];

    return [...classMiddleware, ...methodMiddleware];
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
            `${metadata.path}/layout.tsx`,
            controllerClass,
            methodName,
            [
              {
                path: routeMetadata.path || '',
                component: routeMetadata.component || null,
                options: { index: routeMetadata.path === '/' },
              },
            ]
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
      path,
      method,
      controller,
      methodName,
      params,
    });
  }

  private addViewRoute(
    path: string,
    layout: string,
    controller: Type | undefined,
    methodName: string | undefined,
    children: Array<{
      path: string;
      component: ReactElement | string | null;
      options?: { index?: boolean };
      routeFile?: string;
    }>
  ) {
    this.viewRoutes.push({
      path,
      layout,
      controller,
      methodName,
      children,
    });
  }

  private registerModule(module: any) {
    const routes: Route[] = Reflect.getMetadata(ROUTES_METADATA, module) || [];

    for (const route of routes) {
      if (route.type === 'api' && route.method) {
        this.addApiRoute(
          route.path,
          route.method,
          route.controller,
          route.methodName,
          route.params || []
        );
      } else if (route.type === 'view' && route.layout && route.children) {
        this.addViewRoute(
          route.path,
          route.layout,
          route.controller,
          route.methodName,
          route.children
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
      const data = useLoaderData<{ __viewId?: string }>();
      console.log('Loader data:', data);

      if (!data) {
        console.log('No loader data');
        return null;
      }

      const Component = data.__viewId ? this.viewRegistry[data.__viewId] : null;
      console.log('Found component:', { viewId: data.__viewId, Component });

      return React.createElement(
        ModuleLoaderProvider,
        { value: moduleLoader },
        Component ? React.createElement(Component) : null
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
}
