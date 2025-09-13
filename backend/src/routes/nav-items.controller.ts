import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NavItemsResponseSchema, type NavItem } from '@shared/types';
import { NavItemsService } from '../services/nav-items.service';

@ApiTags('nav')
@Controller('nav-items')
export class NavItemsController {
  constructor(private readonly navItems: NavItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List navigation items' })
  @ApiResponse({ status: 200, description: 'Navigation items' })
  async list(): Promise<NavItem[]> {
    const items = await this.navItems.list();
    return NavItemsResponseSchema.parse(items);
  }
}
