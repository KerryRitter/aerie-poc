import { Injectable } from '~/aerie/core/decorators/injectable.decorator';
import { ServerOnly } from '~/aerie/core/environment/decorators';
import type { Cat } from './cats.types';

@ServerOnly()
@Injectable()
export class CatsServerService {
  private cats: Cat[] = [
    { id: 1, name: 'Mittens', age: 2, breed: 'Persian' },
    { id: 2, name: 'Whiskers', age: 3, breed: 'Siamese' },
    { id: 3, name: 'Luna', age: 1, breed: 'Maine Coon' },
  ];

  private nextId = 4;

  async findAll(): Promise<Cat[]> {
    return this.cats;
  }

  async findOne(id: number): Promise<Cat | undefined> {
    return this.cats.find(cat => cat.id === id);
  }

  async create(cat: Pick<Cat, 'name' | 'age' | 'breed'>): Promise<Cat> {
    const newCat = {
      id: this.nextId++,
      ...cat
    };
    this.cats.push(newCat);
    return newCat;
  }

  async delete(id: number): Promise<void> {
    const index = this.cats.findIndex(cat => cat.id === id);
    if (index !== -1) {
      this.cats.splice(index, 1);
    }
  }
} 