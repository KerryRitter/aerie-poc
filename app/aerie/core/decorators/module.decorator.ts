/// <reference types="reflect-metadata" />
import 'reflect-metadata';
import type { Constructor } from '../types';

export const MODULE_METADATA_KEY = Symbol('MODULE');

export type ModuleOptions = {
  imports?: Constructor[];
  controllers?: Constructor[];
  providers?: Constructor[];
  exports?: Constructor[];
};

export function Module(options: ModuleOptions) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    console.log('Applying Module decorator to:', target.name);
    Reflect.defineMetadata(MODULE_METADATA_KEY, options, target);
    return target;
  };
}

export function getModuleMetadata(target: any): ModuleOptions | undefined {
  return Reflect.getMetadata(MODULE_METADATA_KEY, target);
}
