import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { trace, metrics } from '@opentelemetry/api';

@Injectable()
export class SessionService {
  private readonly refreshPrefix = 'refresh:';
  private static readonly tracer = trace.getTracer('session');
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

  async issueTokens(userId: string) {
    return SessionService.tracer.startActiveSpan(
      'session.issueTokens',
      async (span) => {
        span.setAttribute('user.id', userId);
        const secrets = this.config.get<string[]>('auth.jwtSecrets');
        const secret = secrets[0];
        const accessTtl = this.config.get<number>('auth.accessTtl', 900);
        const refreshTtl = this.config.get<number>('auth.refreshTtl', 604800);
        const accessToken = jwt.sign({ sub: userId }, secret, {
          expiresIn: accessTtl,
          header: { kid: '0' },
        });
        const refreshToken = randomUUID();
        await this.redis.set(
          `${this.refreshPrefix}${refreshToken}`,
          userId,
          'EX',
          refreshTtl,
        );
        SessionService.tokensIssued.add(1);
        span.end();
        return { accessToken, refreshToken };
      },
    );
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
    return SessionService.tracer.startActiveSpan(
      'session.rotate',
      async (span) => {
        const key = `${this.refreshPrefix}${refreshToken}`;
        const userId = await this.redis.get(key);
        if (!userId) {
          span.end();
          return null;
        }
        await this.redis.del(key);
        SessionService.tokensRotated.add(1);
        span.end();
        return this.issueTokens(userId);
      },
    );
  }

  async revoke(refreshToken: string): Promise<void> {
    return SessionService.tracer.startActiveSpan(
      'session.revoke',
      async (span) => {
        await this.redis.del(`${this.refreshPrefix}${refreshToken}`);
        SessionService.tokensRevoked.add(1);
        span.end();
      },
    );
  }
}
