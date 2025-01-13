import { Module } from '../../aerie/core/decorators/module.decorator';
import { CatsServerService } from './cats.server-service';
import { CatsClientService } from './cats.client-service';
import { CatsApiController } from './cats.api-controller';
import { CatsViewController } from './cats.view-controller';

@Module({
  controllers: [CatsApiController, CatsViewController],
  providers: [CatsServerService, CatsClientService],
})
export class CatsModule {}
