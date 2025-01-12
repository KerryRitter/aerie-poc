import { CONTROLLER_METADATA_KEY, ROUTE_METADATA_KEY } from './keys';
import type { RouteMetadata, HttpMethod, ControllerType } from './types';
import type { Type } from '../types';
import type { ReactElement } from 'react';

// Store routes temporarily until Controller decorator is applied
const pendingRoutes = new WeakMap<
  object,
  Map<string | symbol, RouteMetadata>
>();

export const ApiRoute = {
  Get: (path: string = '') => createRouteDecorator('GET', path),
  Post: (path: string = '') => createRouteDecorator('POST', path),
  Put: (path: string = '') => createRouteDecorator('PUT', path),
  Patch: (path: string = '') => createRouteDecorator('PATCH', path),
  Delete: (path: string = '') => createRouteDecorator('DELETE', path),
};

export const Action = {
  default: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('POST', path, component),
  Post: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('POST', path, component),
  Put: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('PUT', path, component),
  Patch: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('PATCH', path, component),
  Delete: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('DELETE', path, component),
};

export const Loader = (path: string = '', component?: ReactElement) =>
  createRouteDecorator('GET', path, component);

export function ApiController(prefix: string = '') {
  const apiPrefix = `/api/${prefix}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return createControllerDecorator(apiPrefix, 'api');
}

export function ViewController(prefix: string = '') {
  return createControllerDecorator(prefix, 'view');
}

function createControllerDecorator(prefix: string, type: ControllerType) {
  return function <T extends Type>(target: T) {
    console.log(`Applying ${type} controller decorator to:`, target.name);

    // Get any pending routes that were registered before the Controller decorator
    const routes = pendingRoutes.get(target.prototype) || new Map();

    const metadata = {
      path: prefix,
      routes,
      type,
    };

    console.log('Setting controller metadata:', {
      controller: target.name,
      path: prefix,
      type,
      routes: Array.from(routes.entries()).map(([key, value]) => ({
        key: String(key),
        method: value.method,
        path: value.path,
      })),
    });

    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, metadata, target);
    return target;
  };
}

function createRouteDecorator(
  method: HttpMethod,
  path: string = '',
  component?: ReactElement
) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    // Store route metadata in the pending routes map
    let routes = pendingRoutes.get(target);
    if (!routes) {
      routes = new Map();
      pendingRoutes.set(target, routes);
    }

    routes.set(propertyKey, { method, path, component });

    console.log('Added route:', {
      target: target.constructor.name,
      propertyKey: String(propertyKey),
      method,
      path,
      component: !!component,
    });

    return descriptor;
  };
}

export type ControllerMetadata = {
  path: string;
  routes: Map<string | symbol, RouteMetadata>;
  type: ControllerType;
};

export function getControllerMetadata(
  target: Type
): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA_KEY, target);
}
