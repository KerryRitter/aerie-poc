export type Type<T = any> = new (...args: any[]) => T;

export type Provider<T = any> =
  | Type<T>
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>;

export type ClassProvider<T = any> = {
  provide: Type<T> | string | symbol;
  useClass: Type<T>;
  inject?: (Type | string | symbol)[];
};

export type ValueProvider<T = any> = {
  provide: Type<T> | string | symbol;
  useValue: T;
};

export type FactoryProvider<T = any> = {
  provide: Type<T> | string | symbol;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: (Type | string | symbol)[];
};

export type DynamicModule = {
  module: Type;
  imports?: (Type | DynamicModule | DynamicModuleAsync)[];
  controllers?: Type[];
  providers?: Provider[];
  exports?: (Type | string | symbol)[];
};

export type DynamicModuleAsync = {
  module: Type;
  imports?: (Type | DynamicModule | DynamicModuleAsync)[];
  controllers?: Type[];
  providers?: Provider[];
  exports?: (Type | string | symbol)[];
};

export type NextFunction = () => void | Promise<void>;

export type MiddlewareFunction = (
  request: Request,
  response: Response,
  next: NextFunction
) => void | Promise<void>;

export interface Middleware {
  use: MiddlewareFunction;
}

export type MiddlewareProvider = MiddlewareFunction | Middleware;

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
