import { Router } from '~/aerie/core/router';
import { AppModule } from '~/app.module';
import { bootstrap } from '../aerie/core/bootstrap';

bootstrap().registerModule(AppModule);

const route = Router.getInstance().createRemixViewRoute();
export const { loader, action } = route;
export default route.Component;
