import { Router } from '~/aerie/core/router';

const { loader, action, Component } = Router.getInstance().createRemixRoute();

export { loader, action };
export default Component; 