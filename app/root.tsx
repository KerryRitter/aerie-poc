import { cssBundleHref } from '@remix-run/css-bundle';
import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import { authenticator } from './services/auth.server';
import './tailwind.css';
import classNames from 'classnames';
import { type ReactElement } from 'react';

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request);
  return json({ user });
};

export default function App(): ReactElement {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="min-h-full bg-gray-50">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full">
        {user && (
          <header className={classNames('bg-white shadow-sm')}>
            <div
              className={classNames(
                'mx-auto max-w-7xl px-4 py-4',
                'sm:px-6 lg:px-8'
              )}
            >
              <div className={classNames('flex justify-between items-center')}>
                <h1
                  className={classNames(
                    'text-lg font-semibold leading-6 text-gray-900'
                  )}
                >
                  Content aerie
                </h1>
                <div className={classNames('flex items-center gap-4')}>
                  <span className={classNames('text-sm text-gray-500')}>
                    {user.name}
                  </span>
                  <form action="/auth/logout" method="post">
                    <button
                      type="submit"
                      className={classNames(
                        'text-sm text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </header>
        )}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
