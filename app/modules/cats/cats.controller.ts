import {
  Body,
  Controller,
  Delete,
  Dependencies,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UseMiddleware,
} from '@aerie/core/decorators';
import { ParseIntPipe } from '@aerie/common/pipes';
import { CatsService } from './cats.service';
import type { Cat } from './cats.types';
import { AuthGuard } from './guards/auth.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggingMiddleware } from './middleware/logging.middleware';

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
