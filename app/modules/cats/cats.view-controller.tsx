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

@Dependencies(CatsService)
@Controller('cats', <CatsList />)
@UseMiddleware(LoggingMiddleware)
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class CatsViewController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  async index() {
    const cats = await this.catsService.findAll();
    return { cats };
  }
}
