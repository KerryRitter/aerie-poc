import { Injectable } from '~/aerie/core/decorators/injectable.decorator';
import { ClientOnly } from '~/aerie/core/environment/decorators';
import type { Cat } from './cats.types';

@Injectable()
export class CatsClientService {
  renderCatLabel(cat: Cat) {
    return `${cat.name} - ${cat.breed} (${cat.age} years old)`;
  }
}
