import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NavIconSchema, type NavIcon } from '@shared/types';
import { NavIconsService } from '../services/nav-icons.service';

@ApiTags('nav')
@Controller('nav-icons')
export class NavIconsController {
  constructor(private readonly icons: NavIconsService) {}

  @Get()
  @ApiOperation({ summary: 'List navigation icons' })
  @ApiResponse({ status: 200, description: 'Array of navigation icons' })
  async list(): Promise<NavIcon[]> {
    const data = await this.icons.list();
    return data.map((icon) => NavIconSchema.parse(icon));
  }
}
