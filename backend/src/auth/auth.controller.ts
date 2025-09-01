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
import {
  LoginRequest,
  LoginRequestSchema,
  type LoginResponse,
  RegisterRequest,
  RegisterRequestSchema,
  MessageResponse,
  RefreshRequest,
  RefreshRequestSchema,
  RequestResetRequest,
  RequestResetSchema,
  VerifyResetCodeRequest,
  VerifyResetCodeSchema,
  ResetPasswordRequest,
  ResetPasswordSchema,
} from '../schemas/auth';
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

  @Post('register')
  @HttpCode(200)
  async register(@Body() body: RegisterRequest): Promise<MessageResponse> {
    try {
      const parsed = RegisterRequestSchema.parse(body);
      await this.auth.register(parsed.email, parsed.password);
      return { message: 'registered' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshRequest): Promise<LoginResponse> {
    try {
      const parsed = RefreshRequestSchema.parse(body);
      const tokens = await this.auth.refresh(parsed.refreshToken);
      if (!tokens) throw new UnauthorizedException('Invalid token');
      return { token: tokens.accessToken };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() body: RefreshRequest): Promise<MessageResponse> {
    try {
      const parsed = RefreshRequestSchema.parse(body);
      await this.auth.logout(parsed.refreshToken);
      return { message: 'logged out' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post('request-reset')
  @HttpCode(200)
  async requestReset(
    @Body() body: RequestResetRequest,
  ): Promise<MessageResponse> {
    try {
      RequestResetSchema.parse(body);
      return { message: 'reset requested' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post('verify-reset-code')
  @HttpCode(200)
  async verifyResetCode(
    @Body() body: VerifyResetCodeRequest,
  ): Promise<MessageResponse> {
    try {
      VerifyResetCodeSchema.parse(body);
      return { message: 'code verified' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    try {
      ResetPasswordSchema.parse(body);
      return { message: 'password reset' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
