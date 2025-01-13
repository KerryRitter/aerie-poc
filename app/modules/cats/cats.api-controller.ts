import {
  ApiController,
  ApiRoute,
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
import { CatsServerService } from './cats.server-service';
import type { Cat } from './cats.types';
import { ParseIntPipe } from '../../aerie/core/pipes';
import { UseMiddleware } from '~/aerie/core/decorators/middleware.decorator';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Dependencies(CatsServerService)
@ApiController('cats')
@UseMiddleware(new LoggingMiddleware())
export class CatsApiController {
  constructor(private readonly catsService: CatsServerService) {}

  @ApiRoute.Get()
  @HttpCode(200)
  @Header('Cache-Control', 'max-age=60')
  async findAll(@Query('limit') limit?: string): Promise<Cat[]> {
    const cats = await this.catsService.findAll();

    if (limit) {
      return cats.slice(0, parseInt(limit));
    }
    return cats;
  }

  @ApiRoute.Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<Cat | undefined> {
    return this.catsService.findOne(id);
  }

  @ApiRoute.Post()
  @HttpCode(201)
  async create(
    @Body() createCat: Pick<Cat, 'name' | 'age' | 'breed'>
  ): Promise<Cat> {
    const newCat = await this.catsService.create(createCat);
    return newCat;
  }

  @ApiRoute.Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.catsService.delete(parseInt(id));
    return;
  }
}
