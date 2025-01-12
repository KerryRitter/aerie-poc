export type RuntimeEnvironment = 'client' | 'server';

// Using typeof window is the most reliable way to detect browser environment
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

export function getCurrentEnvironment(): RuntimeEnvironment {
  const env = isClient ? 'client' : 'server';
  console.log('Current environment:', {
    env,
    isClient,
    isServer,
    hasWindow: typeof window !== 'undefined',
    windowType: typeof window,
    globalType: typeof global,
    processType: typeof process,
    processEnv: process?.env
  });
  return env;
}

export class EnvironmentError extends Error {
  constructor(
    message: string,
    public readonly environment: RuntimeEnvironment,
    public readonly targetEnvironment: RuntimeEnvironment
  ) {
    super(message);
    this.name = 'EnvironmentError';
  }

  static createServerOnlyError(className: string): EnvironmentError {
    return new EnvironmentError(
      `Cannot use ServerOnly service '${className}' in client-side code. Consider:\n` +
      '- Using an interface with different implementations for client/server\n' +
      '- Moving this logic to a server action or loader\n' +
      '- Using a universal alternative',
      'client',
      'server'
    );
  }

  static createClientOnlyError(className: string): EnvironmentError {
    return new EnvironmentError(
      `Cannot use ClientOnly service '${className}' in server-side code. Consider:\n` +
      '- Using an interface with different implementations for client/server\n' +
      '- Moving this logic to client components\n' +
      '- Using a universal alternative like cookies',
      'server',
      'client'
    );
  }
} 