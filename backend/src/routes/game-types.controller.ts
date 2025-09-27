import { type GameTypeList } from '../schemas/game-types';
import { GameTypesService } from '../game-types/game-types.service';
import { createListController } from '../common/controllers/list.controller';

export const GameTypesController: ReturnType<
  typeof createListController<GameTypesService, GameTypeList>
> = createListController<
  GameTypesService,
  GameTypeList
>(
  {
    path: 'game-types',
    tag: 'game-types',
    summary: 'List game types',
    description: 'Array of game types',
  },
  GameTypesService,
);
