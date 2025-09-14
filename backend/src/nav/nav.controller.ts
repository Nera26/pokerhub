import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NavItemSchema, NavItemsResponseSchema, type NavItem } from '@shared/types';
import { NavItemRequestSchema, type NavItemRequest } from '../schemas/nav';
import { NavService } from './nav.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

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

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create navigation item' })
  @ApiResponse({ status: 200, description: 'Created nav item' })
  @HttpCode(200)
  async create(@Body() body: NavItemRequest): Promise<NavItem> {
    const parsed = NavItemRequestSchema.parse(body);
    const item = await this.nav.create(parsed);
    return NavItemSchema.parse(item);
  }

  @Put(':flag')
  @UseGuards(AuthGuard, AdminGuard)
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
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete navigation item' })
  @ApiResponse({ status: 204, description: 'Nav item deleted' })
  async remove(@Param('flag') flag: string): Promise<void> {
    await this.nav.remove(flag);
  }
}
