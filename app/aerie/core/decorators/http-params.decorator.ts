import 'reflect-metadata';

const PARAMS_METADATA_KEY = Symbol('PARAMS_METADATA');

type ParamType = 'PARAM' | 'BODY' | 'QUERY' | 'HEADERS' | 'SESSION' | 'IP';

type ParamMetadata = {
  index: number;
  type: ParamType;
  data?: string;
};

function createParamDecorator(type: ParamType) {
  return function (data?: string) {
    return function (
      target: object,
      propertyKey: string | symbol,
      parameterIndex: number
    ) {
      if (propertyKey === undefined) return;

      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(PARAMS_METADATA_KEY, target, propertyKey) || [];

      existingParams.push({
        index: parameterIndex,
        type,
        data,
      });

      Reflect.defineMetadata(
        PARAMS_METADATA_KEY,
        existingParams,
        target,
        propertyKey
      );
    };
  };
}

export const Param = createParamDecorator('PARAM');
export const Body = createParamDecorator('BODY');
export const Query = createParamDecorator('QUERY');
export const Headers = createParamDecorator('HEADERS');
export const Session = createParamDecorator('SESSION');
export const Ip = createParamDecorator('IP');

export function getParamsMetadata(
  target: any,
  propertyKey: string | symbol
): ParamMetadata[] {
  return Reflect.getMetadata(PARAMS_METADATA_KEY, target, propertyKey) || [];
}
