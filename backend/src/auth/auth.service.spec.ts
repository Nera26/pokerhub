import { AuthService } from './auth.service';
import { ConflictException } from '@nestjs/common';
import Redis from 'ioredis';
import type { SessionService } from '../session/session.service';
import type { ConfigService } from '@nestjs/config';
import type { AnalyticsService } from '../analytics/analytics.service';
import type { UserRepository } from '../users/user.repository';
import type { EmailService } from './email.service';

describe('AuthService register', () => {
  it('throws ConflictException when email exists', async () => {
    const repo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: '1', email: 'test@example.com' }),
      create: jest.fn().mockImplementation((data: any) => ({ id: '1', ...data })),
      save: jest.fn().mockImplementation(async (user: any) => user),
    };
    const service = new AuthService(
      {} as unknown as SessionService,
      {} as unknown as Redis,
      {} as unknown as ConfigService,
      {} as unknown as AnalyticsService,
      repo as unknown as UserRepository,
      {} as unknown as EmailService,
    );

    await service.register('test@example.com', 'secret');
    expect.assertions(3);
    try {
      await service.register('test@example.com', 'secret');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      expect((err as Error).message).toBe('User with this email already exists');
    }
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
