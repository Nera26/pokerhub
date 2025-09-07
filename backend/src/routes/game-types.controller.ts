import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameTypeSchema, GameTypeListSchema, type GameTypeList } from '../schemas/game-types';

@ApiTags('game-types')
@Controller('game-types')
export class GameTypesController {
  @Get()
  @ApiOperation({ summary: 'List game types' })
  @ApiResponse({ status: 200, description: 'Array of game types' })
  list(): GameTypeList {
    return GameTypeListSchema.parse(GameTypeSchema.options);
  }
}
