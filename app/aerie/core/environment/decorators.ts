import { getCurrentEnvironment, EnvironmentError, type RuntimeEnvironment } from './types';

const ENVIRONMENT_METADATA_KEY = Symbol('ENVIRONMENT_METADATA');

type EnvironmentMetadata = {
  restrictTo: RuntimeEnvironment;
};

function createEnvironmentDecorator(environment: RuntimeEnvironment) {
  return function () {
    return function (target: any) {
      // Store the environment metadata
      Reflect.defineMetadata(
        ENVIRONMENT_METADATA_KEY,
        { restrictTo: environment },
        target
      );

      // Create a proxy to check environment on instantiation
      return new Proxy(target, {
        construct(target: any, args: any[], newTarget: Function) {
          const currentEnv = getCurrentEnvironment();
          if (currentEnv !== environment) {
            throw environment === 'server'
              ? EnvironmentError.createServerOnlyError(target.name)
              : EnvironmentError.createClientOnlyError(target.name);
          }
          return Reflect.construct(target, args, newTarget);
        }
      });
    };
  };
}

export const ServerOnly = createEnvironmentDecorator('server');
export const ClientOnly = createEnvironmentDecorator('client');

export function getEnvironmentMetadata(target: any): EnvironmentMetadata | undefined {
  return Reflect.getMetadata(ENVIRONMENT_METADATA_KEY, target);
} 