import { Controller, Post, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

@UseGuards(RateLimitGuard)
@Controller('auth')
export class AuthController {
  @Post('login')
  login() {
    return { status: 'ok' };
  }
}
