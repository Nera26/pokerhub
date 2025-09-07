import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  BONUS_TYPES,
  BONUS_ELIGIBILITY,
  BONUS_STATUSES,
  BonusOptionsResponse,
  BonusOptionsResponseSchema,
} from '../schemas/bonus';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/bonus')
export class AdminBonusController {
  @Get('options')
  @ApiOperation({ summary: 'Get bonus form options' })
  @ApiResponse({ status: 200, description: 'Bonus options' })
  options(): BonusOptionsResponse {
    return BonusOptionsResponseSchema.parse({
      types: BONUS_TYPES,
      eligibilities: BONUS_ELIGIBILITY,
      statuses: BONUS_STATUSES,
    });
  }
}
