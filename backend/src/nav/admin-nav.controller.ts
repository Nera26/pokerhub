import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  NavItemSchema,
  NavItemsResponseSchema,
  type NavItem,
} from '@shared/types';
import { NavItemRequestSchema, type NavItemRequest } from '../schemas/nav';
import { NavService } from './nav.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('nav')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/nav')
export class AdminNavController {
  constructor(private readonly nav: NavService) {}

  @Get()
  @ApiOperation({ summary: 'List navigation items (admin)' })
  @ApiResponse({ status: 200, description: 'Navigation items' })
  async list(): Promise<NavItem[]> {
    const items = await this.nav.list();
    return NavItemsResponseSchema.parse(items);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Create navigation item' })
  @ApiResponse({ status: 200, description: 'Created nav item' })
  async create(@Body() body: NavItemRequest): Promise<NavItem> {
    const parsed = NavItemRequestSchema.parse(body);
    const item = await this.nav.create(parsed);
    return NavItemSchema.parse(item);
  }

  @Put(':flag')
  @ApiOperation({ summary: 'Update navigation item' })
  @ApiResponse({ status: 200, description: 'Updated nav item' })
  async update(
    @Param('flag') flag: string,
    @Body() body: NavItemRequest,
  ): Promise<NavItem> {
    const parsed = NavItemRequestSchema.parse(body);
    const item = await this.nav.update(flag, parsed);
    return NavItemSchema.parse(item);
  }

  @Delete(':flag')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete navigation item' })
  @ApiResponse({ status: 204, description: 'Nav item deleted' })
  async remove(@Param('flag') flag: string): Promise<void> {
    await this.nav.remove(flag);
  }
}
