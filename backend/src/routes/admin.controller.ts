import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  KycDenialResponse,
  KycDenialResponseSchema,
} from '../schemas/wallet';
import { KycService } from '../wallet/kyc.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly kyc: KycService) {}

  @Get('kyc/:id/denial')
  @ApiOperation({ summary: 'Get KYC denial reason' })
  @ApiResponse({ status: 200, description: 'Denial reason' })
  async getKycDenial(@Param('id') id: string): Promise<KycDenialResponse> {
    const reason = await this.kyc.getDenialReason(id);
    return KycDenialResponseSchema.parse({ accountId: id, reason: reason ?? null });
  }
}
