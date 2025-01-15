import { CONTROLLER_METADATA_KEY, ROUTE_METADATA_KEY } from './keys';
import type { RouteMetadata, HttpMethod, ControllerType } from './types';
import type { Type } from '../types';
import type { ReactElement } from 'react';

// Store routes temporarily until Controller decorator is applied
const pendingRoutes = new WeakMap<
  object,
  Map<string | symbol, RouteMetadata>
>();

export function Controller(prefix: string = '', component?: ReactElement) {
  const type = component ? 'view' : 'api';
  const apiPrefix =
    type === 'api'
      ? `/api/${prefix}`.replace(/\/+/g, '/').replace(/\/$/, '')
      : prefix;

  return createControllerDecorator(apiPrefix, type, component);
}

export const Get = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Get decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('GET', path)(target, propertyKey, descriptor);
  };
};

export const Post = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Post decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('POST', path)(target, propertyKey, descriptor);
  };
};

export const Put = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Put decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('PUT', path)(target, propertyKey, descriptor);
  };
};

export const Delete = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Delete decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('DELETE', path)(
      target,
      propertyKey,
      descriptor
    );
  };
};

export const Patch = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Patch decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('PATCH', path)(target, propertyKey, descriptor);
  };
};

export const Options = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Options decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('OPTIONS', path)(
      target,
      propertyKey,
      descriptor
    );
  };
};

export const Head = (path: string = '') => {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const metadata = getControllerMetadata(target.constructor as Type);
    if (metadata?.type === 'view' && path) {
      console.warn(
        `Path parameter "${path}" in @Head decorator will be ignored for view controllers.`
      );
    }
    return createRouteDecorator('HEAD', path)(target, propertyKey, descriptor);
  };
};

function createControllerDecorator(
  prefix: string,
  type: ControllerType,
  component?: ReactElement
) {
  return function <T extends Type>(target: T) {
    console.log(`Applying ${type} controller decorator to:`, target.name);

    // Get any pending routes that were registered before the Controller decorator
    const routes = pendingRoutes.get(target.prototype) || new Map();

    const metadata = {
      path: prefix,
      routes,
      type,
      component,
    };

    console.log('Setting controller metadata:', {
      controller: target.name,
      path: prefix,
      type,
      component: !!component,
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

function createRouteDecorator(method: HttpMethod, path: string = '') {
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

    routes.set(propertyKey, { method, path });

    console.log('Added route:', {
      target: target.constructor.name,
      propertyKey: String(propertyKey),
      method,
      path,
    });

    return descriptor;
  };
}

export type ControllerMetadata = {
  path: string;
  routes: Map<string | symbol, RouteMetadata>;
  type: ControllerType;
  component?: ReactElement;
};

export function getControllerMetadata(
  target: Type
): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA_KEY, target);
}
