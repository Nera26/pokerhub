import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from '../users/users.service';
import { MeResponseSchema, type MeResponse } from '@shared/types';

@ApiTags('user')
@Controller()
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get minimal current user data' })
  @ApiResponse({ status: 200, description: 'Current user avatar URL' })
  async getMe(@Req() req: Request): Promise<MeResponse> {
    const profile = await this.users.getProfile(req.userId!);
    return MeResponseSchema.parse({ avatarUrl: profile.avatarUrl });
  }
}
