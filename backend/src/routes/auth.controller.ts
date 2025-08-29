import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import {
  LoginRequest,
  LoginRequestSchema,
  type LoginResponse,
  MessageResponse,
  RequestResetRequest,
  RequestResetSchema,
  VerifyResetCodeRequest,
  VerifyResetCodeSchema,
  ResetPasswordRequest,
  ResetPasswordSchema,
} from '../schemas/auth';

@UseGuards(RateLimitGuard)
@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginRequest): Promise<LoginResponse> {
    LoginRequestSchema.parse(body);
    return { token: 'mock-token' };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(): Promise<MessageResponse> {
    return { message: 'logged out' };
  }

  @Post('request-reset')
  @HttpCode(200)
  async requestReset(@Body() body: RequestResetRequest): Promise<MessageResponse> {
    RequestResetSchema.parse(body);
    return { message: 'reset requested' };
  }

  @Post('verify-reset-code')
  @HttpCode(200)
  async verifyResetCode(
    @Body() body: VerifyResetCodeRequest,
  ): Promise<MessageResponse> {
    VerifyResetCodeSchema.parse(body);
    return { message: 'code verified' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body() body: ResetPasswordRequest,
  ): Promise<MessageResponse> {
    ResetPasswordSchema.parse(body);
    return { message: 'password reset' };
  }
}
