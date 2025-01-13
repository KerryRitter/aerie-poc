import { AerieConfig } from './aerie/core/aerie-config';
import { AppModule } from './app.module';

export const AERIE_CONFIG: AerieConfig = {
  rootModule: AppModule,
  viewGuardRedirect: 'auth/login',
};
