import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { BonusService } from '../services/bonus.service';
import {
  BonusOptionsResponse,
  BonusOptionsResponseSchema,
} from '../schemas/bonus';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/bonus')
export class AdminBonusController {
  constructor(private readonly bonusService: BonusService) {}

  @Get('options')
  @ApiOperation({ summary: 'Get bonus form options' })
  @ApiResponse({ status: 200, description: 'Bonus options' })
  options(): Promise<BonusOptionsResponse> {
    return this.bonusService.listOptions().then((res) =>
      BonusOptionsResponseSchema.parse(res),
    );
  }
}
