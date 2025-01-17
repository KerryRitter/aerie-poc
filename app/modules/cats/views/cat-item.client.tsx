import { useProvider } from '@aerie/react/hooks';
import React, { type ReactElement } from 'react';
import { CatsClientService } from '../cats.client-service';
import type { Cat } from '../cats.types';

export default function CatItem({ cat }: { cat: Cat }): ReactElement {
  const catsClientService = useProvider(CatsClientService);
  return <li>{catsClientService.renderCatLabel(cat)}</li>;
}
