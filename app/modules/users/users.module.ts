import { Module } from '../../aerie/core/decorators/module.decorator';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
