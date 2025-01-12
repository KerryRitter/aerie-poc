import { createCookieSessionStorage } from '@remix-run/node';
import { Authenticator } from 'remix-auth';
import { GoogleStrategy, type GoogleProfile } from 'remix-auth-google';
import { db } from '~/db/drizzle';
import { accounts, users } from '~/db/schema';
import { env } from '~/env.server';
import { eq } from 'drizzle-orm';

export type User = {
  id: number;
  email: string;
  name: string;
  image: string | null;
};

// Create session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [env.SESSION_SECRET],
    secure: env.NODE_ENV === 'production',
  },
});

// Create authenticator
export const authenticator = new Authenticator<User>(sessionStorage, {
  sessionKey: 'user',
  sessionErrorKey: 'error',
});

// Add Google strategy
authenticator.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.APP_URL}/auth/callback`,
      scope: ['profile', 'email'],
    },
    async ({ profile }: { profile: GoogleProfile }) => {
      let user = await db.query.users.findFirst({
        where: eq(users.email, profile.emails[0].value),
      });

      if (!user) {
        const [newUser] = await db
          .insert(users)
          .values({
            email: profile.emails[0].value,
            name: profile.displayName,
            image: profile.photos?.[0]?.value || null,
          })
          .returning();
        user = newUser;
      }

      await db
        .insert(accounts)
        .values({
          provider: 'google',
          type: 'oauth',
          providerAccountId: profile.id,
          userId: user.id,
        })
        .onConflictDoNothing();

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    }
  )
);

export const { getSession, commitSession, destroySession } = sessionStorage;
