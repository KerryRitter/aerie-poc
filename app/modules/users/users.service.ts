import { Dependencies, Injectable } from '@aerie/core/decorators';
import { DbService } from '@aerie/db';
import type { MyDbService } from '~/schema';

@Injectable()
@Dependencies(DbService)
export class UsersService {
  constructor(private readonly db: MyDbService) {}

  async createUser(name: string, email: string) {
    const result = await this.db.qb
      .insertInto('users')
      .values({
        name,
        email,
        createdAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  async getUsers() {
    return this.db.qb.selectFrom('users').selectAll().execute();
  }

  async getUserByEmail(email: string) {
    return this.db.qb
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }
}
