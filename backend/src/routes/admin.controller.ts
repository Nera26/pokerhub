import { Controller, Get, Param } from '@nestjs/common';
import {
  KycDenialResponse,
  KycDenialResponseSchema,
} from '../schemas/wallet';
import { KycService } from '../wallet/kyc.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly kyc: KycService) {}

  @Get('kyc/:id/denial')
  async getKycDenial(@Param('id') id: string): Promise<KycDenialResponse> {
    const reason = await this.kyc.getDenialReason(id);
    return KycDenialResponseSchema.parse({ accountId: id, reason: reason ?? null });
  }
}
