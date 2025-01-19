import { createRemixApiRoute } from '~/init';

const route = await createRemixApiRoute();
export const { loader, action } = route;
