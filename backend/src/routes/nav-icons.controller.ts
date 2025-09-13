import { NavIconSchema, type NavIcon } from '@shared/types';
import { createListController } from '../common/controllers/list.controller';
import { NavIconsService } from '../services/nav-icons.service';

export const NavIconsController = createListController<
  NavIconsService,
  NavIcon[]
>(
  {
    path: 'nav-icons',
    tag: 'nav',
    summary: 'List navigation icons',
    description: 'Array of navigation icons',
  },
  NavIconsService,
  (data) => data.map((icon) => NavIconSchema.parse(icon)),
);
