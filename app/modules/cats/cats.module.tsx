import { Module } from '../../aerie/core/decorators/module.decorator';
import { CatsService } from './cats.service';
import { CatsClientService } from './cats.client-service';
import { CatsApiController } from './cats.api-controller';
import { CatsViewController } from './cats.view-controller';

@Module({
  controllers: [CatsApiController, CatsViewController],
  providers: [CatsService, CatsClientService],
})
export class CatsModule {}
