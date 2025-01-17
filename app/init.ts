import { AppBootstrap } from '@aerie/core/bootstrap';
import { AppModule } from './app.module';
import { users, cats } from './schema';
import drizzleConfig from '../drizzle.config';

let app: AppBootstrap;

export async function createApp() {
  if (!app) {
    app = await AppBootstrap.initializeRoot(AppModule, {
      viewGuardRedirect: 'auth/login',
      database: {
        schema: { users, cats },
        drizzleConfig,
      },
    });
  }
  return app;
}

// Export route creation functions that use the initialized app
export const createRemixApiRoute = async () =>
  (await createApp()).createRemixApiRoute();
export const createRemixViewRoute = async () =>
  (await createApp()).createRemixViewRoute();
