import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import {
  FeatureFlagSchema,
  FeatureFlagRequestSchema,
  FeatureFlagsResponseSchema,
  type FeatureFlagRequest,
  type FeatureFlag,
  type FeatureFlagsResponse,
} from '../schemas/feature-flags';
import { ZodError } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AuthGuard, AdminGuard)
@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  @ApiResponse({ status: 200, description: 'All feature flags' })
  async list(): Promise<FeatureFlagsResponse> {
    const flags = await this.flags.getAll();
    return FeatureFlagsResponseSchema.parse(flags);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Set feature flag' })
  @ApiResponse({ status: 200, description: 'Flag updated' })
  async set(
    @Param('key') key: string,
    @Body() body: FeatureFlagRequest,
  ): Promise<FeatureFlag> {
    try {
      const parsed = FeatureFlagRequestSchema.parse(body);
      const flag = await this.flags.set(key, parsed.value);
      return FeatureFlagSchema.parse(flag);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Remove feature flag' })
  @ApiResponse({ status: 200, description: 'Flag removed' })
  async remove(@Param('key') key: string): Promise<void> {
    await this.flags.delete(key);
  }

  @Put('room/:tableId/:key')
  @ApiOperation({ summary: 'Set room feature flag' })
  @ApiResponse({ status: 200, description: 'Room flag updated' })
  async setRoom(
    @Param('tableId') tableId: string,
    @Param('key') key: string,
    @Body() body: FeatureFlagRequest,
  ): Promise<FeatureFlag> {
    try {
      const parsed = FeatureFlagRequestSchema.parse(body);
      const flag = await this.flags.setRoom(tableId, key, parsed.value);
      return FeatureFlagSchema.parse(flag);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Delete('room/:tableId/:key')
  @ApiOperation({ summary: 'Remove room flag' })
  @ApiResponse({ status: 200, description: 'Room flag removed' })
  async removeRoom(
    @Param('tableId') tableId: string,
    @Param('key') key: string,
  ): Promise<void> {
    await this.flags.deleteRoom(tableId, key);
  }

  @Put('tourney/:tourneyId/:key')
  @ApiOperation({ summary: 'Set tournament flag' })
  @ApiResponse({ status: 200, description: 'Tournament flag updated' })
  async setTourney(
    @Param('tourneyId') tourneyId: string,
    @Param('key') key: string,
    @Body() body: FeatureFlagRequest,
  ): Promise<FeatureFlag> {
    try {
      const parsed = FeatureFlagRequestSchema.parse(body);
      const flag = await this.flags.setTourney(tourneyId, key, parsed.value);
      return FeatureFlagSchema.parse(flag);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Delete('tourney/:tourneyId/:key')
  @ApiOperation({ summary: 'Remove tournament flag' })
  @ApiResponse({ status: 200, description: 'Tournament flag removed' })
  async removeTourney(
    @Param('tourneyId') tourneyId: string,
    @Param('key') key: string,
  ): Promise<void> {
    await this.flags.deleteTourney(tourneyId, key);
  }
}
