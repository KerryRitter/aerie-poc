import { Module } from '../../aerie/core/decorators/module.decorator';
import { CatsServerService } from './cats.service-server';
import { CatsClientService } from './cats.service-client';
import { CatsController } from './cats.controller';

@Module({
  controllers: [CatsController],
  providers: [CatsServerService, CatsClientService],
  exports: [CatsServerService, CatsClientService],
})
export class CatsModule {} 