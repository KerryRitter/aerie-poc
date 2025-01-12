import 'reflect-metadata';
import { PipeTransform } from '../pipes';
import { Type } from '../types';

const PARAMS_METADATA_KEY = Symbol('PARAMS_METADATA');

type ParamType = 'PARAM' | 'BODY' | 'QUERY' | 'HEADERS' | 'SESSION' | 'IP';

type ParamPipe = Type<PipeTransform> | PipeTransform;

type ParamMetadata = {
  index: number;
  type: ParamType;
  data?: string;
  pipes?: ParamPipe[];
  metatype?: Type;
};

function createParamDecorator(type: ParamType) {
  return function (data?: string | ParamPipe, ...pipes: ParamPipe[]) {
    return function (
      target: object,
      propertyKey: string | symbol,
      parameterIndex: number
    ) {
      if (propertyKey === undefined) return;

      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(PARAMS_METADATA_KEY, target, propertyKey) || [];

      const types = Reflect.getMetadata(
        'design:paramtypes',
        target,
        propertyKey
      );
      const metatype = types?.[parameterIndex];

      // Handle case where first argument is a pipe
      let paramData: string | undefined;
      let paramPipes: ParamPipe[] = [];

      if (typeof data === 'string') {
        paramData = data;
        paramPipes = pipes;
      } else if (data) {
        paramPipes = [data, ...pipes];
      }

      existingParams.push({
        index: parameterIndex,
        type,
        data: paramData,
        pipes: paramPipes,
        metatype,
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
