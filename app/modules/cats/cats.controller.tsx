import * as React from 'react';
import {
  Controller,
  Json,
  Loader,
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
import { CatsServerService } from './cats.service-server';
import { CatsClientService } from './cats.service-client';
import type { Cat } from './cats.types';

const TestRoute = () => {
  return <div>Test Route</div>;
};

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsServerService) {}

  @Loader('test', <TestRoute />)
  async testLoader() {
    const cats = await this.catsService.findAll();
    return { cats };
  }

  @Json.Get()
  @HttpCode(200)
  @Header('Cache-Control', 'max-age=60')
  async findAll(@Query('limit') limit?: string): Promise<Cat[]> {
    const cats = await this.catsService.findAll();

    if (limit) {
      return cats.slice(0, parseInt(limit));
    }
    return cats;
  }

  @Json.Get(':id')
  async findOne(@Param('id') id: string): Promise<Cat | undefined> {
    return this.catsService.findOne(parseInt(id));
  }

  @Json.Post()
  @HttpCode(201)
  async create(
    @Body() createCat: Pick<Cat, 'name' | 'age' | 'breed'>
  ): Promise<Cat> {
    const newCat = await this.catsService.create(createCat);
    return newCat;
  }

  @Json.Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.catsService.delete(parseInt(id));
    return;
  }
}
