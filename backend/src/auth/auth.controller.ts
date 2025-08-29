import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { LoginRequest, LoginRequestSchema, type LoginResponse } from '../schemas/auth';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { AuthService } from './auth.service';

@UseGuards(RateLimitGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    try {
      const parsed = LoginRequestSchema.parse(body);
      const tokens = await this.auth.login(parsed.email, parsed.password);
      if (!tokens) throw new UnauthorizedException('Invalid credentials');
      return { token: tokens.accessToken };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
