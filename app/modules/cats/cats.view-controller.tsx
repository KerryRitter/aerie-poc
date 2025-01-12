import * as React from 'react';
import {
  ViewController,
  Loader,
} from '../../aerie/core/decorators/http.decorator';
import { CatsServerService } from './cats.server-service';
import { CatsList } from './views/cats-list';

@ViewController('cats')
export class CatsViewController {
  constructor(private readonly catsService: CatsServerService) {}

  @Loader('', <CatsList />)
  async testLoader() {
    const cats = await this.catsService.findAll();
    return { cats };
  }
}
