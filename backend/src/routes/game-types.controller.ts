import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameTypeListSchema, type GameType } from '../schemas/game-types';

@ApiTags('game-types')
@Controller('game-types')
export class GameTypesController {
  @Get()
  @ApiOperation({ summary: 'List available game types' })
  @ApiResponse({ status: 200, description: 'Available game types' })
  getGameTypes(): GameType[] {
    return GameTypeListSchema.parse(['texas', 'omaha', 'allin', 'tournaments']);
  }
}
