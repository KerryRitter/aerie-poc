import * as React from 'react';
import { Dependencies } from '../../aerie/core/decorators/injectable.decorator';
import {
  ViewController,
  Loader,
} from '../../aerie/core/decorators/http.decorator';
import { CatsServerService } from './cats.server-service';
import { UseMiddleware } from '../../aerie/core/decorators/middleware.decorator';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { UseGuards } from '../../aerie/core/decorators/guards.decorator';
import { AuthGuard } from './guards/auth.guard';
import { UseInterceptors } from '../../aerie/core/decorators/interceptors.decorator';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { CatsList } from './views/cats-list';

@Dependencies(CatsServerService)
@ViewController('cats')
@UseMiddleware(LoggingMiddleware)
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class CatsViewController {
  constructor(private readonly catsService: CatsServerService) {}

  @Loader('', <CatsList />)
  async index() {
    const cats = await this.catsService.findAll();
    return { cats };
  }
}
