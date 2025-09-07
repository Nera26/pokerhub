import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type GameTypeList } from '../schemas/game-types';
import { GameTypesService } from '../game-types/game-types.service';

@ApiTags('game-types')
@Controller('game-types')
export class GameTypesController {
  constructor(private readonly service: GameTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List game types' })
  @ApiResponse({ status: 200, description: 'Array of game types' })
  async list(): Promise<GameTypeList> {
    return await this.service.list();
  }
}
