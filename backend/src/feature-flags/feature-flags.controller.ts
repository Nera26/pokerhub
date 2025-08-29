import { Controller, Get, Put, Delete, Param, Body, BadRequestException } from '@nestjs/common';
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

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  async list(): Promise<FeatureFlagsResponse> {
    const flags = await this.flags.getAll();
    return FeatureFlagsResponseSchema.parse(flags);
  }

  @Put(':key')
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
  async remove(@Param('key') key: string): Promise<void> {
    await this.flags.delete(key);
  }
}
