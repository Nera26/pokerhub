import {
  Body,
  Controller,
  HttpCode,
  ForbiddenException,
  Post,
  UnauthorizedException,
  Req,
  Get,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  AuthProvidersResponse,
} from '../schemas/auth';
import { AuthService } from './auth.service';
import { GeoIpService } from './geoip.service';
import { Request } from 'express';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly geo: GeoIpService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(
    res: Response,
    refreshToken: string,
    maxAgeSeconds: number,
  ) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    });
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Returns access token' })
  async login(
    @Body() body: LoginRequest,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    if (!this.geo.isAllowed(ip)) throw new ForbiddenException('Country not allowed');
    const parsed = LoginRequestSchema.parse(body);
    const tokens = await this.auth.login(parsed.email, parsed.password);
    if (!tokens) throw new UnauthorizedException('Invalid credentials');
    const ttl = this.config.get<number>('auth.refreshTtl', 604800);
    this.setRefreshCookie(res, tokens.refreshToken, ttl);
    return { token: tokens.accessToken };
  }

  @Post('register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  async register(@Body() body: RegisterRequest): Promise<MessageResponse> {
    const parsed = RegisterRequestSchema.parse(body);
    await this.auth.register(parsed.email, parsed.password);
    return { message: 'registered' };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Returns refreshed access token' })
  async refresh(
    @Body() body: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const parsed = RefreshRequestSchema.parse(body);
    const tokens = await this.auth.refresh(parsed.refreshToken);
    if (!tokens) throw new UnauthorizedException('Invalid token');
    const ttl = this.config.get<number>('auth.refreshTtl', 604800);
    this.setRefreshCookie(res, tokens.refreshToken, ttl);
    return { token: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(
    @Body() body: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResponse> {
    const parsed = RefreshRequestSchema.parse(body);
    await this.auth.logout(parsed.refreshToken);
    this.setRefreshCookie(res, '', 0);
    return { message: 'logged out' };
  }

  @Post('request-reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset requested' })
  async requestReset(
    @Body() body: RequestResetRequest,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    const parsed = RequestResetSchema.parse(body);
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    await this.auth.requestPasswordReset(parsed.email, ip);
    return { message: 'reset requested' };
  }

  @Post('verify-reset-code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Code verified' })
  async verifyResetCode(
    @Body() body: VerifyResetCodeRequest,
  ): Promise<MessageResponse> {
    const parsed = VerifyResetCodeSchema.parse(body);
    const ok = await this.auth.verifyResetCode(parsed.email, parsed.code);
    if (!ok) throw new UnauthorizedException('Invalid code');
    return { message: 'code verified' };
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using code' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    const parsed = ResetPasswordSchema.parse(body);
    const ok = await this.auth.resetPassword(
      parsed.email,
      parsed.code,
      parsed.password,
    );
    if (!ok) throw new UnauthorizedException('Invalid code');
    return { message: 'password reset' };
  }

  @Get('providers')
  @HttpCode(200)
  @ApiOperation({ summary: 'List auth providers' })
  @ApiResponse({ status: 200, description: 'Returns auth providers' })
  async getProviders(): Promise<AuthProvidersResponse> {
    return this.auth.getProviders();
  }
}
