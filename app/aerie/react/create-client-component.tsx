import React, { type ComponentType, type ReactElement, Suspense } from 'react';
import { isClient } from '../core/environment/types';

type ClientImport = () => Promise<{ default: ComponentType<any> }>;

/**
 * Creates a component that safely handles client-side only code in a server-side rendering environment.
 * This is necessary when a component uses browser-only APIs or dependencies that aren't available during SSR.
 *
 * @param importFn - Dynamic import function that returns the client-side component
 * @param Fallback - Component to render during loading and on the server
 * @returns A wrapped component that handles both SSR and client-side rendering
 *
 * @example
 * ```tsx
 * const ClientChart = createClientComponent(
 *   () => import('./Chart'),
 *   LoadingSpinner
 * );
 * ```
 */
export function createClientComponent<P extends object>(
  importFn: ClientImport,
  Fallback: ComponentType<P>
): ComponentType<P> {
  if (!isClient) {
    return Fallback;
  }

  const LazyComponent = React.lazy(importFn);

  return function ClientWrapper(props: P): ReactElement {
    return (
      <Suspense fallback={<Fallback {...props} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
