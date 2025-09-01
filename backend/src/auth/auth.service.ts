import { Inject, Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AnalyticsService } from '../analytics/analytics.service';

interface UserRecord {
  id: string;
  password: string;
}

@Injectable()
export class AuthService {
  private users = new Map<string, UserRecord>();
  private readonly revokedPrefix = 'revoked:';

  constructor(
    private readonly sessions: SessionService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {
    const hash = bcrypt.hashSync('secret', 10);
    this.users.set('user@example.com', { id: '1', password: hash });
  }

  async register(email: string, password: string) {
    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    this.users.set(email, { id, password: hash });
    return id;
  }

  private async validateUser(email: string, password: string): Promise<string | null> {
    const user = this.users.get(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return user.id;
  }

  async login(email: string, password: string) {
    const userId = await this.validateUser(email, password);
    if (!userId) return null;
    await this.analytics.emit('auth.login', { userId, ts: Date.now() });
    return this.sessions.issueTokens(userId);
  }

  async refresh(refreshToken: string) {
    const revoked = await this.redis.get(
      `${this.revokedPrefix}${refreshToken}`,
    );
    if (revoked) {
      return null;
    }
    const rotated = await this.sessions.rotate(refreshToken);
    if (!rotated) {
      return null;
    }
    const ttl = this.config.get<number>('auth.refreshTtl', 604800);
    await this.redis.set(
      `${this.revokedPrefix}${refreshToken}`,
      '1',
      'EX',
      ttl,
    );
    return rotated;
  }
}
