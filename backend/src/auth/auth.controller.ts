import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  ForbiddenException,
  Post,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { LoginRequest, LoginRequestSchema, type LoginResponse } from '../schemas/auth';
import { AuthService } from './auth.service';
import { GeoIpService } from './geoip.service';
import { Request } from 'express';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly geo: GeoIpService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginRequest,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    try {
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
      if (!this.geo.isAllowed(ip)) throw new ForbiddenException('Country not allowed');
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
