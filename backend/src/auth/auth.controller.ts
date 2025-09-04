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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly geo: GeoIpService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Returns access token' })
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
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
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
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Returns refreshed access token' })
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
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out' })
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
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset requested' })
  async requestReset(
    @Body() body: RequestResetRequest,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    try {
      const parsed = RequestResetSchema.parse(body);
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
      await this.auth.requestPasswordReset(parsed.email, ip);
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
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Code verified' })
  async verifyResetCode(
    @Body() body: VerifyResetCodeRequest,
  ): Promise<MessageResponse> {
    try {
      const parsed = VerifyResetCodeSchema.parse(body);
      const ok = await this.auth.verifyResetCode(parsed.email, parsed.code);
      if (!ok) throw new UnauthorizedException('Invalid code');
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
  @ApiOperation({ summary: 'Reset password using code' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    try {
      const parsed = ResetPasswordSchema.parse(body);
      const ok = await this.auth.resetPassword(
        parsed.email,
        parsed.code,
        parsed.password,
      );
      if (!ok) throw new UnauthorizedException('Invalid code');
      return { message: 'password reset' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
