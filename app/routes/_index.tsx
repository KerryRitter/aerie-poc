import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import { db } from '~/db/drizzle';
import { ideas } from '~/db/schema';
import { eq } from 'drizzle-orm';
import classNames from 'classnames';
import { type ReactElement } from 'react';

type LoaderData = {
  ideas: Array<{
    id: number;
    title: string;
    description: string | null;
    status: string;
  }>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  });

  const userIdeas = await db.query.ideas.findMany({
    where: eq(ideas.userId, user.id),
    orderBy: (ideas, { desc }) => [desc(ideas.createdAt)],
  });

  return json<LoaderData>({ ideas: userIdeas });
};

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'selected', label: 'Selected for Work' },
  { id: 'ready', label: 'Content Ready' },
  { id: 'published', label: 'Published' },
];

export default function Index(): ReactElement {
  const { ideas } = useLoaderData<LoaderData>();

  return (
    <div className={classNames('container mx-auto p-4')}>
      <div className={classNames('flex justify-between items-center mb-8')}>
        <h1 className={classNames('text-2xl font-bold')}>My Content Ideas</h1>
        <Link
          to="/ideas/new"
          className={classNames(
            'bg-blue-500 text-white px-4 py-2 rounded',
            'hover:bg-blue-600 transition-colors'
          )}
        >
          New Idea
        </Link>
      </div>

      <div className={classNames('grid grid-cols-1 md:grid-cols-4 gap-4')}>
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={classNames('bg-gray-50 rounded-lg p-4')}
          >
            <h2 className={classNames('text-lg font-semibold mb-4')}>
              {column.label}
            </h2>
            <div className={classNames('space-y-4')}>
              {ideas
                .filter((idea) => idea.status === column.id)
                .map((idea) => (
                  <Link
                    key={idea.id}
                    to={`/ideas/${idea.id}`}
                    className={classNames(
                      'block bg-white p-4 rounded shadow',
                      'hover:shadow-md transition-shadow'
                    )}
                  >
                    <h3 className={classNames('font-medium')}>{idea.title}</h3>
                    {idea.description && (
                      <p className={classNames('text-gray-600 text-sm mt-2')}>
                        {idea.description}
                      </p>
                    )}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
