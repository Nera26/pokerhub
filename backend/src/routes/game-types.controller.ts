import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GameTypeSchema,
  GameTypeListSchema,
  type GameTypeList,
  type GameType,
} from '../schemas/game-types';

@ApiTags('game-types')
@Controller('game-types')
export class GameTypesController {
  private static readonly LABELS: Record<GameType, string> = {
    texas: "Texas Hold'em",
    omaha: 'Omaha',
    allin: 'All-in or Fold',
    tournaments: 'Tournaments',
  } as const;

  @Get()
  @ApiOperation({ summary: 'List game types' })
  @ApiResponse({ status: 200, description: 'Array of game types' })
  list(): GameTypeList {
    const data = GameTypeSchema.options.map((id) => ({
      id,
      label: GameTypesController.LABELS[id] ?? id,
    }));
    return GameTypeListSchema.parse(data);
  }
}
