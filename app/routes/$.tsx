import { createRemixViewRoute } from '../init';

const route = await createRemixViewRoute();
export const { loader, action } = route;
export default route.Component;
