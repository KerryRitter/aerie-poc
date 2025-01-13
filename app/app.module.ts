import { Module } from './aerie/core/decorators/module.decorator';
import { DbModule } from './aerie/core/db';
import { CatsModule } from './modules/cats/cats.module';
import { UsersModule } from './modules/users/users.module';
import { Router } from './aerie/core/router';
import { LoggingMiddleware } from './modules/cats/middleware/logging.middleware';
import { AuthGuard } from './modules/cats/guards/auth.guard';
import { LoggingInterceptor } from './modules/cats/interceptors/logging.interceptor';

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
