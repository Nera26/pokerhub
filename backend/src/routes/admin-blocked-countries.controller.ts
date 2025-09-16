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
  BlockedCountrySchema,
  BlockedCountriesResponseSchema,
  type BlockedCountry,
  type BlockedCountriesResponse,
} from '@shared/types';
import { BlockedCountriesService } from '../services/blocked-countries.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@Controller('admin/blocked-countries')
@UseGuards(AuthGuard, AdminGuard)
export class AdminBlockedCountriesController {
  constructor(private readonly blockedCountries: BlockedCountriesService) {}

  @Get()
  @ApiOperation({ summary: 'List blocked countries' })
  @ApiResponse({ status: 200, description: 'Blocked countries' })
  async list(): Promise<BlockedCountriesResponse> {
    const records = await this.blockedCountries.list();
    return BlockedCountriesResponseSchema.parse(records);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Add blocked country' })
  @ApiResponse({ status: 200, description: 'Created blocked country' })
  async create(@Body() body: BlockedCountry): Promise<BlockedCountry> {
    const parsed = BlockedCountrySchema.parse(body);
    const created = await this.blockedCountries.create(parsed.country);
    return BlockedCountrySchema.parse(created);
  }

  @Put(':country')
  @ApiOperation({ summary: 'Update blocked country' })
  @ApiResponse({ status: 200, description: 'Updated blocked country' })
  async update(
    @Param('country') country: string,
    @Body() body: BlockedCountry,
  ): Promise<BlockedCountry> {
    const current = BlockedCountrySchema.shape.country.parse(country);
    const parsed = BlockedCountrySchema.parse(body);
    const updated = await this.blockedCountries.update(
      current,
      parsed.country,
    );
    return BlockedCountrySchema.parse(updated);
  }

  @Delete(':country')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove blocked country' })
  @ApiResponse({ status: 204, description: 'Blocked country removed' })
  async remove(@Param('country') country: string): Promise<void> {
    const parsed = BlockedCountrySchema.shape.country.parse(country);
    await this.blockedCountries.remove(parsed);
  }
}
