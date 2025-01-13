import { createRemixViewRoute } from '../init';

const route = createRemixViewRoute();
export const { loader, action } = route;
export default route.Component;
