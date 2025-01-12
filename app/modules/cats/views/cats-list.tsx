import React, { type ReactElement, useEffect } from 'react';
import { useLoaderData } from '@remix-run/react';
import { useProvider } from '../../../aerie/react/hooks';
import type { Cat } from '../cats.types';
import { CatsClientService } from '../cats.client-service';

export function CatsList(): ReactElement {
  const { cats } = useLoaderData<{
    cats: Cat[];
  }>();
  const catsClientService = useProvider(CatsClientService);

  return (
    <div>
      <h1>Cats</h1>
      <ul>
        {cats.map((cat) => (
          <li key={cat.id}>{catsClientService.renderCatLabel(cat)}</li>
        ))}
      </ul>
    </div>
  );
}
