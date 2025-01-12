import { type LoaderFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import classNames from 'classnames';
import { type ReactElement } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // If we're already authenticated, redirect to the home page
  const user = await authenticator.isAuthenticated(request);
  if (user) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/' },
    });
  }
  return null;
};

export default function Login(): ReactElement {
  return (
    <div
      className={classNames(
        'min-h-screen flex items-center justify-center bg-gray-50'
      )}
    >
      <div
        className={classNames(
          'max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow'
        )}
      >
        <div>
          <h2
            className={classNames(
              'mt-6 text-center text-3xl font-extrabold text-gray-900'
            )}
          >
            Sign in to your account
          </h2>
        </div>
        <Form
          action="/auth/login"
          method="post"
          className={classNames('mt-8 space-y-6')}
        >
          <button
            type="submit"
            className={classNames(
              'group relative w-full flex justify-center',
              'py-2 px-4 border border-transparent text-sm font-medium',
              'rounded-md text-white bg-blue-600 hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            )}
          >
            Sign in with Google
          </button>
        </Form>
      </div>
    </div>
  );
}
