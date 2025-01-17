import { Module } from '@aerie/core/decorators';
import { Router } from '@aerie/core/router';
import { DbModule } from '@aerie/db';
import { CatsModule } from './modules/cats/cats.module';
import { AuthGuard } from './modules/cats/guards/auth.guard';
import { LoggingInterceptor } from './modules/cats/interceptors/logging.interceptor';
import { LoggingMiddleware } from './modules/cats/middleware/logging.middleware';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [CatsModule, DbModule, UsersModule],
})
export class AppModule {
  constructor(router: Router) {
    // Add global middleware, guards, and interceptors
    router.useGlobalMiddleware(LoggingMiddleware);
    router.useGlobalGuards(AuthGuard);
    router.useGlobalInterceptors(LoggingInterceptor);
  }
}
