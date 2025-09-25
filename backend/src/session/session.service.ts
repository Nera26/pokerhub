import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { metrics } from '@opentelemetry/api';
import { withSpan } from '../common/tracing';

@Injectable()
export class SessionService {
  private readonly refreshPrefix = 'refresh:';
  private static readonly meter = metrics.getMeter('session');
  private static readonly tokensIssued = SessionService.meter.createCounter(
    'session_tokens_issued_total',
    { description: 'Total refresh tokens issued' },
  );
  private static readonly tokensRotated = SessionService.meter.createCounter(
    'session_tokens_rotated_total',
    { description: 'Total refresh tokens rotated' },
  );
  private static readonly tokensRevoked = SessionService.meter.createCounter(
    'session_tokens_revoked_total',
    { description: 'Total refresh tokens revoked' },
  );

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  private parseRefreshValue(value: string | null): {
    userId: string | null;
    role?: 'admin';
  } {
    if (!value) {
      return { userId: null };
    }
    try {
      const parsed = JSON.parse(value) as {
        userId?: string;
        role?: string;
      };
      if (parsed && typeof parsed.userId === 'string') {
        return {
          userId: parsed.userId,
          role: parsed.role === 'admin' ? 'admin' : undefined,
        };
      }
    } catch {
      // ignore parsing errors and fallback to legacy string format
    }
    return { userId: value };
  }

  async issueTokens(userId: string, opts: { role?: 'admin' } = {}) {
    return withSpan('session.issueTokens', async (span) => {
      span.setAttribute('user.id', userId);
      const secrets = this.config.get<string[]>('auth.jwtSecrets');
      const secret = secrets[0];
      const accessTtl = this.config.get<number>('auth.accessTtl', 900);
      const refreshTtl = this.config.get<number>('auth.refreshTtl', 604800);
      const payload: Record<string, unknown> = { sub: userId };
      if (opts.role) {
        payload.role = opts.role;
      }
      const accessToken = jwt.sign(payload, secret, {
        expiresIn: accessTtl,
        header: { kid: '0' },
      });
      const refreshToken = randomUUID();
      const refreshValue = opts.role
        ? JSON.stringify({ userId, role: opts.role })
        : userId;
      await this.redis.set(
        `${this.refreshPrefix}${refreshToken}`,
        refreshValue,
        'EX',
        refreshTtl,
      );
      SessionService.tokensIssued.add(1);
      return { accessToken, refreshToken };
    });
  }

  verifyAccessToken(token: string): string | null {
    const secrets = this.config.get<string[]>('auth.jwtSecrets', []);
    for (const secret of secrets) {
      try {
        const payload = jwt.verify(token, secret) as any;
        return payload.sub as string;
      } catch {
        continue;
      }
    }
    return null;
  }

  async rotate(refreshToken: string) {
    return withSpan('session.rotate', async (span) => {
      const key = `${this.refreshPrefix}${refreshToken}`;
      const stored = await this.redis.get(key);
      const { userId, role } = this.parseRefreshValue(stored);
      if (!userId) {
        return null;
      }
      await this.redis.del(key);
      SessionService.tokensRotated.add(1);
      return this.issueTokens(userId, { role });
    });
  }

  async revoke(refreshToken: string): Promise<void> {
    return withSpan('session.revoke', async (span) => {
      await this.redis.del(`${this.refreshPrefix}${refreshToken}`);
      SessionService.tokensRevoked.add(1);
    });
  }

  async revokeAll(userId: string): Promise<void> {
    return withSpan('session.revokeAll', async (span) => {
      span.setAttribute('user.id', userId);
      const keys = await this.redis.keys(`${this.refreshPrefix}*`);
      let revoked = 0;
      for (const key of keys) {
        const { userId: storedUser } = this.parseRefreshValue(
          await this.redis.get(key),
        );
        if (storedUser === userId) {
          await this.redis.del(key);
          revoked++;
        }
      }
      SessionService.tokensRevoked.add(revoked);
    });
  }
}
