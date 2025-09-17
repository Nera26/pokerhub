import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { NavIcon } from '@shared/types';
import { NavIconsService } from '../services/nav-icons.service';

export abstract class NavIconsReadController {
  constructor(protected readonly icons: NavIconsService) {}

  @Get()
  @ApiOperation({ summary: 'List navigation icon metadata' })
  @ApiResponse({ status: 200, description: 'Navigation icons' })
  async list(): Promise<NavIcon[]> {
    return this.icons.listValidated();
  }
}

@ApiTags('nav')
@Controller('nav-icons')
export class NavIconsController extends NavIconsReadController {
  constructor(icons: NavIconsService) {
    super(icons);
  }
}
