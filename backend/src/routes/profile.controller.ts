import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from '../users/users.service';
import { UserProfileSchema, type UserProfile } from '@shared/types';

@ApiTags('user')
@Controller('user')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Req() req: Request): Promise<UserProfile> {
    const profile = await this.users.getProfile(req.userId!);
    return UserProfileSchema.parse(profile);
  }
}
