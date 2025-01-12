import { Router } from '~/aerie/core/router';
import { AERIE_CONFIG } from '../aerie.config';

const route = Router.getInstance(AERIE_CONFIG).createRemixViewRoute();
export const { loader, action } = route;
export default route.Component;
