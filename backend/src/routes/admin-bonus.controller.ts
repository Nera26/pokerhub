import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  BONUS_TYPES,
  BONUS_ELIGIBILITY,
  BONUS_STATUSES,
  BONUS_TYPE_LABELS,
  BONUS_ELIGIBILITY_LABELS,
  BONUS_STATUS_LABELS,
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
      types: BONUS_TYPES.map((value) => ({
        value,
        label: BONUS_TYPE_LABELS[value],
      })),
      eligibilities: BONUS_ELIGIBILITY.map((value) => ({
        value,
        label: BONUS_ELIGIBILITY_LABELS[value],
      })),
      statuses: BONUS_STATUSES.map((value) => ({
        value,
        label: BONUS_STATUS_LABELS[value],
      })),
    });
  }
}
