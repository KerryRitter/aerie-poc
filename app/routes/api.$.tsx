import { Router } from '~/aerie/core/router';
import { AERIE_CONFIG } from '~/aerie.config';

export const { loader, action } =
  Router.getInstance(AERIE_CONFIG).createRemixApiRoute();
