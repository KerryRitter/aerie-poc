import React, { type ReactElement } from 'react';
import { useLoaderData } from '@remix-run/react';
import type { Cat } from '../cats.types';
import { createClientComponent } from '@aerie/react/create-client-component';

function CatItemFallback({ cat }: { cat: Cat }): ReactElement {
  return (
    <li>
      {cat.name} - {cat.breed} ({cat.age} years old)
    </li>
  );
}

const ClientCatItem = createClientComponent<{ cat: Cat }>(
  () => import('./cat-item.client'),
  CatItemFallback
);

export function CatsList(): ReactElement {
  const { cats } = useLoaderData<{
    cats: Cat[];
  }>();

  return (
    <div>
      <h1>Cats</h1>
      <ul>
        {cats.map((cat) => (
          <ClientCatItem key={cat.id} cat={cat} />
        ))}
      </ul>
    </div>
  );
}
