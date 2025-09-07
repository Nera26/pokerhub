import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UserProfileSchema, type UserProfile } from '@shared/types';

@ApiTags('user')
@Controller('user')
@UseGuards(AuthGuard)
export class ProfileController {
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(): Promise<UserProfile> {
    return UserProfileSchema.parse({
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      bank: '\u2022\u2022\u2022\u2022 1234',
      location: 'United States',
      joined: new Date('2023-01-15').toISOString(),
      bio: 'Texas grinder. Loves Omaha. Weekend warrior.',
      experience: 1234,
      balance: 1250,
    });
  }
}
