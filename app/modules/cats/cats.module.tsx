import { Module } from '../../aerie/core/decorators/module.decorator';
import { CatsService } from './cats.service';
import { CatsClientService } from './cats.client-service';
import { CatsController } from './cats.controller';
import { CatsViewController } from './cats.view-controller';

@Module({
  controllers: [CatsController, CatsViewController],
  providers: [CatsService, CatsClientService],
})
export class CatsModule {}
