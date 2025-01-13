import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
} from '../../aerie/core/decorators/http.decorator';
import {
  Body,
  Param,
  Query,
} from '../../aerie/core/decorators/http-params.decorator';
import {
  HttpCode,
  Header,
} from '../../aerie/core/decorators/http-response.decorator';
import { Dependencies } from '../../aerie/core/decorators/injectable.decorator';
import { CatsService } from './cats.service';
import type { Cat } from './cats.types';
import { ParseIntPipe } from '../../aerie/core/pipes';
import { UseMiddleware } from '../../aerie/core/decorators/middleware.decorator';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { UseGuards } from '../../aerie/core/decorators/guards.decorator';
import { AuthGuard } from './guards/auth.guard';
import { UseInterceptors } from '../../aerie/core/decorators/interceptors.decorator';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Dependencies(CatsService)
@Controller('cats')
@UseMiddleware(LoggingMiddleware)
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  @HttpCode(200)
  @Header('Cache-Control', 'max-age=60')
  async findAll(@Query('limit') limit?: string) {
    const cats = await this.catsService.findAll();

    if (limit) {
      return cats.slice(0, parseInt(limit));
    }
    return cats;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createCat: Omit<Cat, 'id' | 'createdAt'>) {
    return this.catsService.create(createCat);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCat: Partial<Omit<Cat, 'id' | 'createdAt'>>
  ) {
    return this.catsService.update(id, updateCat);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.catsService.delete(id);
    return;
  }
}
