import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NavItemsResponseSchema, type NavItem } from '@shared/types';

@ApiTags('nav')
@Controller('nav-items')
export class NavItemsController {
  @Get()
  @ApiOperation({ summary: 'List navigation items' })
  @ApiResponse({ status: 200, description: 'Navigation items' })
  list(): NavItem[] {
    const items: NavItem[] = [
      { flag: 'lobby', href: '/', label: 'Lobby', icon: 'home' },
      { flag: 'wallet', href: '/wallet', label: 'Wallet', icon: 'wallet' },
      { flag: 'promotions', href: '/promotions', label: 'Promotions', icon: 'tags' },
      { flag: 'leaderboard', href: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
      { flag: 'notifications', href: '/notifications', label: 'Alerts', icon: 'bell' },
      { flag: 'profile', href: '/user', label: 'Profile' },
    ];
    return NavItemsResponseSchema.parse(items);
  }
}
