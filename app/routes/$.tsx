import { Router } from '~/aerie/core/router';
import { AppModule } from '~/app.module';
import { bootstrap } from '../aerie/core/bootstrap';

bootstrap().registerModule(AppModule);

const { loader, action } = Router.getInstance().createRemixRoute();

export { loader, action };
// export default Component;
