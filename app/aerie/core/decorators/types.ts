import type { ReactElement } from 'react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type RouteMetadata = {
  path: string;
  method: HttpMethod;
  isJson: boolean;
  component?: ReactElement;
}; 