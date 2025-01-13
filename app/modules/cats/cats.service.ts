import {
  Injectable,
  Dependencies,
} from '../../aerie/core/decorators/injectable.decorator';
import { ServerOnly } from '../../aerie/core/environment/decorators';
import { DbService } from '../../aerie/core/db';
import type { MyDbService } from '../../schema';
import type { Cat } from './cats.types';

@Injectable()
@Dependencies(DbService)
@ServerOnly()
export class CatsService {
  constructor(private readonly db: MyDbService) {}

  async create(cat: Omit<Cat, 'id' | 'createdAt'>) {
    const result = await this.db.qb
      .insertInto('cats')
      .values({
        name: cat.name,
        age: cat.age,
        breed: cat.breed,
        createdAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async findAll() {
    return this.db.qb.selectFrom('cats').selectAll().execute();
  }

  async findOne(id: number) {
    return this.db.qb
      .selectFrom('cats')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async update(id: number, cat: Partial<Omit<Cat, 'id' | 'createdAt'>>) {
    return this.db.qb
      .updateTable('cats')
      .set(cat)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(id: number) {
    return this.db.qb
      .deleteFrom('cats')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
