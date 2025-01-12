import { Injectable } from '~/aerie/core/decorators/injectable.decorator';
import { ClientOnly } from '~/aerie/core/environment/decorators';
import type { Cat } from './cats.types';

@ClientOnly()
@Injectable()
export class CatsClientService {
  private cats: Cat[] = [];

  setCats(cats: Cat[]) {
    this.cats = cats;
  }

  getCats(): Cat[] {
    return this.cats;
  }

  addCat(cat: Cat) {
    this.cats = [...this.cats, cat];
  }
} 