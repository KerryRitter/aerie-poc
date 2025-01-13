export type Type<T = any> = new (...args: any[]) => T;

export type NextFunction = () => void | Promise<void>;

export type MiddlewareFunction = (
  request: Request,
  response: Response,
  next: NextFunction
) => void | Promise<void>;

export type Middleware = MiddlewareFunction | { use: MiddlewareFunction };

export type RouteInfo = {
  path: string;
  method: string;
};
