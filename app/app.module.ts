import {
  Module,
  UseModuleMiddleware,
  UseModuleGuards,
  UseModuleInterceptors,
} from '@aerie/core/decorators';
import { Router } from '@aerie/core/router';
import { DbModule } from '@aerie/db';
import { DbService } from '@aerie/db/db.service';
import { LoggerModule } from '@aerie/logging';
import { CatsModule } from './modules/cats/cats.module';
import { AuthGuard } from './modules/cats/guards/auth.guard';
import { LoggingInterceptor } from './modules/cats/interceptors/logging.interceptor';
import { LoggingMiddleware } from './modules/cats/middleware/logging.middleware';
import { UsersModule } from './modules/users/users.module';
import { AerieConfig } from '@aerie/core';
import { AerieCommonModule } from '@aerie/common';
import { Dependencies } from '@aerie/core/decorators';

@Module({
  imports: [
    AerieCommonModule,
    CatsModule,
    DbModule,
    UsersModule,
    LoggerModule.forRoot(),
  ],
  providers: [LoggingMiddleware, AuthGuard, LoggingInterceptor],
})
@UseModuleMiddleware(LoggingMiddleware)
@UseModuleGuards(AuthGuard)
@UseModuleInterceptors(LoggingInterceptor)
@Dependencies(AerieConfig, DbService)
export class AppModule {
  constructor(
    config: AerieConfig,
    private readonly dbService: DbService<any>
  ) {
    // Get router instance
    Router.getInstance(config);

    // Initialize database
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      await this.dbService.initializeConnection();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}
