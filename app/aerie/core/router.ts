import { PipeTransform } from '@aerie/common/pipes';
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { matchPath } from '@remix-run/router';
import * as React from 'react';
import { ReactElement } from 'react';
import { ModuleLoaderProvider } from '../react/hooks';
import { AerieConfig } from './aerie-config';
import { Container } from './container';
import { getControllerMetadata } from './decorators/http.decorator';
import { ModuleLoader } from './module-loader';
import {
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  MIDDLEWARE_METADATA,
  ROUTES_METADATA,
} from './reflect';
import {
  ExecutionContext,
  Guard,
  Interceptor,
  MiddlewareProvider,
  Type,
  Middleware,
} from './types';
import {
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from './exceptions';
import { getModuleRef, getModuleMetadata } from './decorators/module.decorator';

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
  private globalMiddleware: MiddlewareProvider[] = [];
  private globalGuards: Guard[] = [];
  private globalInterceptors: Interceptor[] = [];

  private constructor(private readonly config: AerieConfig) {
    this.container = Container.getInstance();
    this.container.setInstance(AerieConfig, config);

    // Register routes for all registered controllers
    const controllers = this.container.getAllRegistered();
    for (const controller of controllers) {
      this.registerControllerRoutes(controller);
    }
  }

  static getInstance(config?: AerieConfig): Router {
    if (!Router.instance) {
      if (!config) {
        throw new Error('Router must be initialized with config first');
      }
      Router.instance = new Router(config);
    }
    return Router.instance;
  }

  static initialize(config: AerieConfig): Router {
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
    console.log('Handling API route:', route);
    const controller = await this.container.resolve(route.controller);
    console.log('Resolved controller:', controller);

    const result = await this.processRequest(
      request,
      response,
      controller,
      route.methodName,
      params
    );
    console.log('API route result:', result);
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

    const controller = await this.container.resolve(route.controller);
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
    const viewId =
      `${route.controller.name.replace('Controller', '').toLowerCase()}/${route.methodName}`.replace(
        /^\/+|\/+$/g,
        ''
      );
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
    try {
      const context: ExecutionContext = {
        request,
        response,
        type: request.url.includes('/api/') ? 'api' : 'view',
      };

      // First check guards
      const guards = await this.getGuards(target.constructor, methodName);
      for (const guard of guards) {
        const canActivate = await guard.canActivate(context);
        if (!canActivate) {
          throw new ForbiddenException();
        }
      }

      // Then process middleware and interceptors
      const middleware = await this.getMiddleware(
        target.constructor,
        methodName
      );
      const interceptors = await this.getInterceptors(
        target.constructor,
        methodName
      );

      // Create the final handler that includes middleware and the actual method
      const handler = async () => {
        return this.executeMiddleware(middleware, request, response, () =>
          target[methodName].apply(target, params)
        );
      };

      // Apply interceptors
      const handle = interceptors.reduce(
        (next, interceptor) => ({
          handle: () => interceptor.intercept(context, next),
        }),
        { handle: handler }
      );

      return await handle.handle();
    } catch (error) {
      console.error('Error processing request:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private async getGuards(target: any, methodName?: string): Promise<Guard[]> {
    const classGuards: Guard[] =
      Reflect.getMetadata(GUARDS_METADATA, target) || [];
    const methodGuards: Guard[] = methodName
      ? Reflect.getMetadata(GUARDS_METADATA, target, methodName) || []
      : [];

    // Get module-level guards
    const moduleRef = getModuleRef(target);
    const moduleMetadata = moduleRef ? getModuleMetadata(moduleRef) : undefined;
    const moduleGuards = moduleMetadata?.guards || [];

    const resolveGuard = async (guard: Guard | Type<Guard>): Promise<Guard> => {
      if (typeof guard === 'function' && !('canActivate' in guard)) {
        return this.container.resolve(guard);
      }
      return guard as Guard;
    };

    const resolvedModuleGuards = await Promise.all(
      moduleGuards.map(resolveGuard)
    );
    const resolvedClassGuards = await Promise.all(
      classGuards.map(resolveGuard)
    );
    const resolvedMethodGuards = await Promise.all(
      methodGuards.map(resolveGuard)
    );

    return [
      ...resolvedModuleGuards,
      ...resolvedClassGuards,
      ...resolvedMethodGuards,
    ];
  }

  private async getMiddleware(
    target: any,
    methodName?: string
  ): Promise<MiddlewareProvider[]> {
    const classMiddleware: MiddlewareProvider[] =
      Reflect.getMetadata(MIDDLEWARE_METADATA, target) || [];
    const methodMiddleware: MiddlewareProvider[] = methodName
      ? Reflect.getMetadata(MIDDLEWARE_METADATA, target, methodName) || []
      : [];

    // Get module-level middleware
    const moduleRef = getModuleRef(target);
    const moduleMetadata = moduleRef ? getModuleMetadata(moduleRef) : undefined;
    const moduleMiddleware = moduleMetadata?.middleware || [];

    const resolveMiddleware = async (
      middleware: MiddlewareProvider
    ): Promise<MiddlewareProvider> => {
      if (typeof middleware === 'function' && !('use' in middleware)) {
        return middleware;
      }
      return this.container.resolve(middleware as unknown as Type);
    };

    const resolvedModuleMiddleware = await Promise.all(
      moduleMiddleware.map(resolveMiddleware)
    );
    const resolvedClassMiddleware = await Promise.all(
      classMiddleware.map(resolveMiddleware)
    );
    const resolvedMethodMiddleware = await Promise.all(
      methodMiddleware.map(resolveMiddleware)
    );

    return [
      ...resolvedModuleMiddleware,
      ...resolvedClassMiddleware,
      ...resolvedMethodMiddleware,
    ];
  }

  private async executeMiddleware(
    middleware: MiddlewareProvider[],
    request: Request,
    response: Response,
    next: () => Promise<any>
  ): Promise<any> {
    if (!middleware.length) {
      return next();
    }

    const executeNext = async (index: number): Promise<any> => {
      if (index >= middleware.length) {
        return next();
      }

      const handler = middleware[index];

      // Handle class-based middleware
      if (
        typeof handler === 'function' &&
        'prototype' in handler &&
        handler.prototype.use
      ) {
        const middlewareClass = handler as unknown as Type<Middleware>;
        const instance =
          await this.container.resolve<Middleware>(middlewareClass);
        return instance.use(request, response, () => executeNext(index + 1));
      }

      // Handle function middleware
      if (typeof handler === 'function') {
        return handler(request, response, () => executeNext(index + 1));
      }

      // Handle instance middleware
      return handler.use(request, response, () => executeNext(index + 1));
    };

    return executeNext(0);
  }

  private async getInterceptors(
    target: any,
    methodName?: string
  ): Promise<Interceptor[]> {
    const classInterceptors: Interceptor[] =
      Reflect.getMetadata(INTERCEPTORS_METADATA, target) || [];
    const methodInterceptors: Interceptor[] = methodName
      ? Reflect.getMetadata(INTERCEPTORS_METADATA, target, methodName) || []
      : [];

    // Get module-level interceptors
    const moduleRef = getModuleRef(target);
    const moduleMetadata = moduleRef ? getModuleMetadata(moduleRef) : undefined;
    const moduleInterceptors = moduleMetadata?.interceptors || [];

    const resolveInterceptor = async (
      interceptor: Interceptor | Type<Interceptor>
    ): Promise<Interceptor> => {
      if (typeof interceptor === 'function' && !('intercept' in interceptor)) {
        return this.container.resolve(interceptor);
      }
      return interceptor as Interceptor;
    };

    const resolvedModuleInterceptors = await Promise.all(
      moduleInterceptors.map(resolveInterceptor)
    );
    const resolvedClassInterceptors = await Promise.all(
      classInterceptors.map(resolveInterceptor)
    );
    const resolvedMethodInterceptors = await Promise.all(
      methodInterceptors.map(resolveInterceptor)
    );

    return [
      ...resolvedModuleInterceptors,
      ...resolvedClassInterceptors,
      ...resolvedMethodInterceptors,
    ];
  }

  registerController(controller: Type) {
    console.log('Registering controller:', controller.name);
    const metadata = getControllerMetadata(controller);
    console.log('Controller metadata:', metadata);
    const routes = Reflect.getMetadata(ROUTES_METADATA, controller) || [];
    console.log('Routes metadata:', routes);
    this.registerControllerRoutes(controller);
    console.log('Current routes:', {
      api: this.apiRoutes,
      view: this.viewRoutes,
    });
  }

  private registerControllerRoutes(controller: Type) {
    const metadata = getControllerMetadata(controller);
    if (!metadata) return;

    if (metadata.type === 'api') {
      for (const [key, route] of metadata.routes.entries()) {
        this.apiRoutes.push({
          type: 'api',
          path: `${metadata.path}/${route.path}`.replace(/\/+/g, '/'),
          method: route.method,
          controller,
          methodName: key.toString(),
          params: [],
        });
      }
    } else {
      for (const [key, route] of metadata.routes.entries()) {
        const path = `${metadata.path}/${route.path}`.replace(/\/+/g, '/');
        const viewId =
          `${controller.name.replace('Controller', '').toLowerCase()}/${String(key)}`.replace(
            /^\/+|\/+$/g,
            ''
          );

        // Register the component in the view registry
        if (
          metadata.component &&
          typeof metadata.component.type === 'function'
        ) {
          console.log('Registering view component:', {
            viewId,
            component: metadata.component.type.name,
            path,
          });
          this.viewRegistry[viewId] = metadata.component.type;
        }

        this.viewRoutes.push({
          type: 'view',
          path,
          controller,
          component: metadata.component || null,
          methodName: key.toString(),
        });
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
      }>();
      console.log('Loader data:', data);

      if (!data || !data.__viewId) {
        console.log('No loader data or viewId');
        return null;
      }

      const ComponentType = this.viewRegistry[data.__viewId];
      console.log('Found component type:', {
        viewId: data.__viewId,
        ComponentType,
      });

      if (!ComponentType) {
        return null;
      }

      return React.createElement(
        ModuleLoaderProvider,
        { value: moduleLoader },
        React.createElement(ComponentType, data)
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

  async useGlobalMiddleware(middleware: Type<MiddlewareProvider>) {
    const instance =
      await this.container.resolve<MiddlewareProvider>(middleware);
    if (typeof instance === 'function') {
      this.globalMiddleware.push(instance);
    } else if (typeof instance.use === 'function') {
      this.globalMiddleware.push(instance.use.bind(instance));
    }
    return this;
  }

  async useGlobalGuards(guard: Type<Guard>) {
    const instance = await this.container.resolve<Guard>(guard);
    this.globalGuards.push(instance);
    return this;
  }

  async useGlobalInterceptors(interceptor: Type<Interceptor>) {
    const instance = await this.container.resolve<Interceptor>(interceptor);
    this.globalInterceptors.push(instance);
    return this;
  }
}
