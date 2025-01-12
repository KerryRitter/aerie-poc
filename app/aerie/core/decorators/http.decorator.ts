import { CONTROLLER_METADATA_KEY, ROUTE_METADATA_KEY } from './keys';
import type { RouteMetadata, HttpMethod } from './types';
import type { Constructor } from '../types';
import type { ReactElement } from 'react';

type MethodDecoratorContext = ClassMethodDecoratorContext<any, any>;

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
    const metadata = {
      path: prefix,
      routes: new Map<string | symbol, RouteMetadata>(),
    };
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
    const controller = Reflect.getMetadata(
      CONTROLLER_METADATA_KEY,
      target.constructor
    );
    if (!controller) {
      throw new Error(`Class must be decorated with @Controller`);
    }

    const routes = controller.routes;
    routes.set(propertyKey, { method, path, isJson, component });

    Reflect.defineMetadata(
      CONTROLLER_METADATA_KEY,
      { ...controller, routes },
      target.constructor
    );
    return descriptor;
  };
}

// Legacy decorators - mark as deprecated
/** @deprecated Use Json.Get instead */
export const Get = (path: string = '') => createRouteDecorator('GET', path);
/** @deprecated Use Json.Post instead */
export const Post = (path: string = '') => createRouteDecorator('POST', path);
/** @deprecated Use Json.Put instead */
export const Put = (path: string = '') => createRouteDecorator('PUT', path);
/** @deprecated Use Json.Patch instead */
export const Patch = (path: string = '') => createRouteDecorator('PATCH', path);
/** @deprecated Use Json.Delete instead */
export const Delete = (path: string = '') =>
  createRouteDecorator('DELETE', path);

export type ControllerMetadata = {
  path: string;
  routes: Map<string | symbol, RouteMetadata>;
};

export function getControllerMetadata(
  target: Constructor
): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA_KEY, target);
}
