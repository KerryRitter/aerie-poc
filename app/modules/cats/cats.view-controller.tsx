import {
  Controller,
  Dependencies,
  Get,
  UseGuards,
  UseInterceptors,
  UseMiddleware,
} from '@aerie/core/decorators';
import { CatsService } from './cats.service';
import { AuthGuard } from './guards/auth.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { CatsList } from './views/cats-list';
import { UseMiddleware as UseMiddlewareDecorator } from '@aerie/core/decorators/middleware.decorator';
import { UseGuards as UseGuardsDecorator } from '@aerie/core/decorators/guards.decorator';
import { UseInterceptors as UseInterceptorsDecorator } from '@aerie/core/decorators/interceptors.decorator';

@Dependencies(CatsService)
@Controller('cats', <CatsList />)
@UseMiddlewareDecorator(LoggingMiddleware)
@UseGuardsDecorator(AuthGuard)
@UseInterceptorsDecorator(LoggingInterceptor)
export class CatsViewController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  async index() {
    const cats = await this.catsService.findAll();
    return { cats };
  }
}
