import 'reflect-metadata';
import React, { type ReactElement } from 'react';
import { useProvider } from '../../../aerie/react/hooks';
import type { Cat } from '../cats.types';
import { CatsClientService } from '../cats.client-service';

export default function CatItem({ cat }: { cat: Cat }): ReactElement {
  const catsClientService = useProvider(CatsClientService);
  return <li>{catsClientService.renderCatLabel(cat)}</li>;
}
