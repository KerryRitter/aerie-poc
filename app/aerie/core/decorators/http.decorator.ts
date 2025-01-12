import { CONTROLLER_METADATA_KEY, ROUTE_METADATA_KEY } from './keys';
import type { RouteMetadata, HttpMethod } from './types';
import type { Constructor } from '../types';
import type { ReactElement } from 'react';

// Store routes temporarily until Controller decorator is applied
const pendingRoutes = new WeakMap<
  object,
  Map<string | symbol, RouteMetadata>
>();

export const Json = {
  Get: (path: string = '') => createRouteDecorator('GET', path, true),
  Post: (path: string = '') => createRouteDecorator('POST', path, true),
  Put: (path: string = '') => createRouteDecorator('PUT', path, true),
  Patch: (path: string = '') => createRouteDecorator('PATCH', path, true),
  Delete: (path: string = '') => createRouteDecorator('DELETE', path, true),
};

export const Action = {
  default: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('POST', path, false, component),
  Post: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('POST', path, false, component),
  Put: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('PUT', path, false, component),
  Patch: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('PATCH', path, false, component),
  Delete: (path: string = '', component?: ReactElement) =>
    createRouteDecorator('DELETE', path, false, component),
};

export const Loader = (path: string = '', component?: ReactElement) =>
  createRouteDecorator('GET', path, false, component);

export function Controller(prefix: string = '') {
  return function <T extends Constructor>(target: T) {
    console.log('Applying Controller decorator to:', target.name);

    // Get any pending routes that were registered before the Controller decorator
    const routes = pendingRoutes.get(target.prototype) || new Map();

    const metadata = {
      path: prefix,
      routes,
    };

    console.log('Setting controller metadata:', {
      controller: target.name,
      path: prefix,
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
  isJson: boolean = false,
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

    routes.set(propertyKey, { method, path, isJson, component });

    console.log('Added route:', {
      target: target.constructor.name,
      propertyKey: String(propertyKey),
      method,
      path,
      isJson,
    });

    return descriptor;
  };
}

export type ControllerMetadata = {
  path: string;
  routes: Map<string | symbol, RouteMetadata>;
};

export function getControllerMetadata(
  target: Constructor
): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA_KEY, target);
}
