import { AppBootstrap } from './aerie/core/bootstrap';
import { AppModule } from './app.module';
import { users, cats } from './schema';

let app: AppBootstrap;

export async function createApp() {
  if (!app) {
    app = await AppBootstrap.initializeRoot(AppModule, {
      viewGuardRedirect: 'auth/login',
      database: {
        dialect: 'sqlite',
        file: ':memory:', // Use in-memory SQLite for development
        schema: { users, cats },
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
