import { Module } from './aerie/core/decorators/module.decorator';
import { CatsModule } from './modules/cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
