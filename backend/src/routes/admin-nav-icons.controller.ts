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
import { NavIconSchema, type NavIcon } from '@shared/types';
import { NavIconsService } from '../services/nav-icons.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@Controller('admin/nav-icons')
@UseGuards(AuthGuard, AdminGuard)
export class AdminNavIconsController {
  constructor(private readonly icons: NavIconsService) {}

  @Get()
  @ApiOperation({ summary: 'List navigation icon metadata' })
  @ApiResponse({ status: 200, description: 'Navigation icons' })
  async list(): Promise<NavIcon[]> {
    return this.icons.listValidated();
  }

  @Post()
  @ApiOperation({ summary: 'Create navigation icon' })
  @ApiResponse({ status: 200, description: 'Created nav icon' })
  @HttpCode(200)
  async create(@Body() body: NavIcon): Promise<NavIcon> {
    const parsed = NavIconSchema.parse(body);
    const created = await this.icons.create(parsed);
    return NavIconSchema.parse(created);
  }

  @Put(':name')
  @ApiOperation({ summary: 'Update navigation icon' })
  @ApiResponse({ status: 200, description: 'Updated nav icon' })
  async update(
    @Param('name') name: string,
    @Body() body: NavIcon,
  ): Promise<NavIcon> {
    const parsed = NavIconSchema.parse(body);
    const updated = await this.icons.update(name, parsed);
    return NavIconSchema.parse(updated);
  }

  @Delete(':name')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete navigation icon' })
  @ApiResponse({ status: 204, description: 'Nav icon deleted' })
  async remove(@Param('name') name: string): Promise<void> {
    await this.icons.remove(name);
  }
}
