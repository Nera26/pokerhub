import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CTAsResponseSchema,
  CTASchema,
  type CTAsResponse,
  type CTA,
} from '../schemas/ctas';
import { CTARepository } from '../ctas/cta.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('lobby')
@Controller('ctas')
export class CtasController {
  constructor(private readonly repo: CTARepository) {}

  @Get()
  @ApiOperation({ summary: 'Get lobby CTAs' })
  @ApiResponse({ status: 200, description: 'CTA list' })
  async getCtas(): Promise<CTAsResponse> {
    const ctas = await this.repo.find();
    return CTAsResponseSchema.parse(ctas);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create CTA' })
  @ApiResponse({ status: 200, description: 'Created CTA' })
  @HttpCode(200)
  async createCta(@Body() body: CTA): Promise<CTA> {
    const parsed = CTASchema.parse(body);
    const saved = await this.repo.save(parsed);
    return CTASchema.parse(saved);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update CTA' })
  @ApiResponse({ status: 200, description: 'Updated CTA' })
  async updateCta(@Param('id') id: string, @Body() body: CTA): Promise<CTA> {
    const parsed = CTASchema.parse(body);
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('CTA not found');
    }
    const merged = { ...existing, ...parsed };
    const saved = await this.repo.save(merged);
    return CTASchema.parse(saved);
  }
}

