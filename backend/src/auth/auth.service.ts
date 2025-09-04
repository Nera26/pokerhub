import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { randomInt, createHash, timingSafeEqual } from 'crypto';
import { AnalyticsService } from '../analytics/analytics.service';
import { MetricsWriterService } from '../metrics/metrics-writer.service';
import { UserRepository } from '../users/user.repository';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly revokedPrefix = 'revoked:';
  private readonly resetPrefix = 'reset:';
  private readonly resetReqPrefix = 'reset-req:';

  constructor(
    private readonly sessions: SessionService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
    private readonly users: UserRepository,
    private readonly email: EmailService,
    private readonly metrics: MetricsWriterService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = this.users.create({
      email,
      password: hash,
      username: email,
    });
    const saved = await this.users.save(user);
    return saved.id;
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<string | null> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || !user.password) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return user.id;
  }

  async login(email: string, password: string) {
    const userId = await this.validateUser(email, password);
    if (!userId) return null;
    await this.analytics.emit('auth.login', { userId, ts: Date.now() });
    await this.metrics.recordLogin(userId);
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

  async logout(refreshToken: string) {
    const ttl = this.config.get<number>('auth.refreshTtl', 604800);
    await this.redis.set(
      `${this.revokedPrefix}${refreshToken}`,
      '1',
      'EX',
      ttl,
    );
    await this.sessions.revoke(refreshToken);
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  async requestPasswordReset(email: string, ip?: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) return;

    const limit = this.config.get<number>('auth.resetReqLimit', 5);
    const window = this.config.get<number>('auth.resetReqWindow', 3600);

    const emailKey = `${this.resetReqPrefix}${email}`;
    const emailCount = await this.redis.incr(emailKey);
    if (emailCount === 1) await this.redis.expire(emailKey, window);
    if (emailCount > limit) return;

    if (ip) {
      const ipKey = `${this.resetReqPrefix}${ip}`;
      const ipCount = await this.redis.incr(ipKey);
      if (ipCount === 1) await this.redis.expire(ipKey, window);
      if (ipCount > limit) return;
    }

    const code = randomInt(100000, 1000000).toString();
    const ttl = this.config.get<number>('auth.resetTtl', 900);
    const hash = this.hashCode(code);
    await this.redis.set(`${this.resetPrefix}${email}`, hash, 'EX', ttl);
    await this.email.sendResetCode(email, code);
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`${this.resetPrefix}${email}`);
    if (!stored) return false;
    const hashed = this.hashCode(code);
    if (stored.length !== hashed.length) return false;
    return timingSafeEqual(
      Buffer.from(stored, 'hex'),
      Buffer.from(hashed, 'hex'),
    );
  }

  async resetPassword(
    email: string,
    code: string,
    password: string,
  ): Promise<boolean> {
    const valid = await this.verifyResetCode(email, code);
    if (!valid) return false;
    const user = await this.users.findOne({ where: { email } });
    if (!user) return false;
    user.password = await bcrypt.hash(password, 10);
    await this.users.save(user);
    await this.sessions.revokeAll(user.id);
    await this.redis.del(`${this.resetPrefix}${email}`);
    return true;
  }
}
