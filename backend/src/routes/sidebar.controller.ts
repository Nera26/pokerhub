import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SidebarService } from './sidebar.service';
import {
  SidebarItemsResponseSchema,
  type SidebarItem,
} from '../schemas/sidebar';

@UseGuards(AuthGuard, AdminGuard)
@ApiTags('sidebar')
@Controller('sidebar')
export class SidebarController {
  constructor(private readonly sidebar: SidebarService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard sidebar items' })
  @ApiResponse({ status: 200, description: 'Sidebar items' })
  async list(): Promise<SidebarItem[]> {
    const items = await this.sidebar.list();
    return SidebarItemsResponseSchema.parse(items);
  }
}
