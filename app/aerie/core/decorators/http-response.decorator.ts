import 'reflect-metadata';

const HTTP_CODE_METADATA_KEY = Symbol('HTTP_CODE_METADATA');
const HEADERS_METADATA_KEY = Symbol('HEADERS_METADATA');
const REDIRECT_METADATA_KEY = Symbol('REDIRECT_METADATA');

type HeadersMetadata = Record<string, string>;

type RedirectMetadata = {
  url: string;
  statusCode: number;
};

export function HttpCode(statusCode: number) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      `http:statusCode:${String(propertyKey)}`,
      statusCode,
      target.constructor
    );
    return descriptor;
  };
}

export function Header(name: string, value: string) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingHeaders =
      Reflect.getMetadata(
        `http:headers:${String(propertyKey)}`,
        target.constructor
      ) || new Map<string, string>();
    existingHeaders.set(name, value);
    Reflect.defineMetadata(
      `http:headers:${String(propertyKey)}`,
      existingHeaders,
      target.constructor
    );
    return descriptor;
  };
}

export function Redirect(url: string, statusCode: number = 302) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      REDIRECT_METADATA_KEY,
      { url, statusCode },
      target.constructor,
      propertyKey
    );
    return descriptor;
  };
}

export function getHttpCodeMetadata(
  target: any,
  propertyKey: string | symbol
): number | undefined {
  return Reflect.getMetadata(HTTP_CODE_METADATA_KEY, target, propertyKey);
}

export function getHeadersMetadata(
  target: any,
  propertyKey: string | symbol
): HeadersMetadata {
  return Reflect.getMetadata(HEADERS_METADATA_KEY, target, propertyKey) || {};
}

export function getRedirectMetadata(
  target: any,
  propertyKey: string | symbol
): RedirectMetadata | undefined {
  return Reflect.getMetadata(REDIRECT_METADATA_KEY, target, propertyKey);
}
