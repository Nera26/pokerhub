import { Controller, Get } from '@nestjs/common';
import { TournamentService } from './tournament.service';

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
