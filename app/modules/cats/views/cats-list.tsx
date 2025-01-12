import React, { type ReactElement } from 'react';
import { useLoaderData } from '@remix-run/react';
import { useProvider } from '../../../aerie/react/hooks';
import { useEffect } from 'react';
import { CatsClientService } from '../cats.service-client';
import type { Cat } from '../cats.types';

export function CatsList(): ReactElement {
  const cats = useLoaderData<Cat[]>();
  const catsClientService = useProvider(CatsClientService);

  useEffect(() => {
    // Sync server data to client service
    catsClientService.setCats(cats);
  }, [cats, catsClientService]);

  return (
    <div>
      <h1>Cats</h1>
      <ul>
        {catsClientService.getCats().map((cat) => (
          <li key={cat.id}>
            {cat.name} - {cat.breed} ({cat.age} years old)
          </li>
        ))}
      </ul>
    </div>
  );
} 