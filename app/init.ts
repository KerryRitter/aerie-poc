import { AppBootstrap } from './aerie/core/bootstrap';
import { AppModule } from './app.module';

let app: AppBootstrap;

export function createApp() {
  if (!app) {
    app = AppBootstrap.getInstance({
      rootModule: AppModule,
      viewGuardRedirect: 'auth/login',
    });
    app.ensureRootInitialized();
  }
  return app;
}

// Export route creation functions that use the initialized app
export const createRemixApiRoute = () => createApp().createRemixApiRoute();
export const createRemixViewRoute = () => createApp().createRemixViewRoute();
