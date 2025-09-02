import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { Redis } from 'ioredis';
import { WalletService } from './wallet.service';
import { PaymentProviderService } from './payment-provider.service';

@ApiTags('wallet')
@Controller('wallet/provider')
export class WebhookController {
  constructor(
    private readonly wallet: WalletService,
    private readonly provider: PaymentProviderService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.provider.registerHandler('3ds', (event) => this.wallet.confirm3DS(event));
    void this.provider.drainQueue();
  }

  @Post('callback')
  @ApiOperation({ summary: 'Handle provider callback' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async callback(@Req() req: Request, @Body() body: unknown) {
    const eventId = req.headers['x-event-id'] as string | undefined;
    if (!eventId) {
      throw new BadRequestException('missing event id');
    }
    const payload = JSON.stringify(body);
    const signature = req.headers['x-provider-signature'] as string;
    if (!signature || !this.provider.verifySignature(payload, signature)) {
      throw new UnauthorizedException('invalid signature');
    }
    const key = `wallet:webhook:${eventId}`;
    const stored = await this.redis.set(key, '1', 'NX', 'EX', 60 * 60 * 24);
    if (stored === null) {
      return { message: 'acknowledged' };
    }
    await this.provider.confirm3DS(body);
    return { message: 'acknowledged' };
  }
}
