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

export type ExecutionContext = {
  request: Request;
  response: Response;
  type: 'api' | 'view';
};

export type Guard = {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
};

export type CallHandler = {
  handle(): Promise<any>;
};

export type Interceptor = {
  intercept(context: ExecutionContext, next: CallHandler): Promise<any>;
};
