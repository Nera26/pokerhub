import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NavItemsResponseSchema, type NavItem } from '@shared/types';
import { NavService } from './nav.service';

@ApiTags('nav')
@Controller('nav-items')
export class NavController {
  constructor(private readonly nav: NavService) {}

  @Get()
  @ApiOperation({ summary: 'List navigation items' })
  @ApiResponse({ status: 200, description: 'Navigation items' })
  async list(): Promise<NavItem[]> {
    const items = await this.nav.list();
    return NavItemsResponseSchema.parse(items);
  }
}
