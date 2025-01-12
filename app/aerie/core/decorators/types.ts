import type { ReactElement } from 'react';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

export type ControllerType = 'api' | 'view';

export type RouteMetadata = {
  path: string;
  method: HttpMethod;
  component?: ReactElement;
};
