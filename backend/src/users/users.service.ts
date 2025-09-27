import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Span } from '@opentelemetry/api';
import { withSpan } from '../common/tracing';
import {
  CreateUserRequest,
  UpdateUserRequest,
  type UserProfile,
  type ProfileStatsResponse,
} from '@shared/types';
import { UserRepository } from './user.repository';
import { QueryFailedError, In } from 'typeorm';
import { Account } from '../wallet/account.entity';
import { Leaderboard } from '../database/entities/leaderboard.entity';
import * as bcrypt from 'bcrypt';
import type { User as UserEntity } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  private async withUser<T>(
    id: string,
    span: Span,
    fn: (user: UserEntity) => Promise<T>,
  ): Promise<T> {
    span.setAttribute('user.id', id);
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return fn(user);
  }

  async create(data: CreateUserRequest): Promise<UserEntity> {
    return withSpan('users.create', async (span) => {
      try {
        const passwordHash = data.password
          ? await bcrypt.hash(data.password, 10)
          : undefined;

        const user = this.users.create({
          username: data.username,
          avatarKey: data.avatarKey,
          banned: false,
          email: data.email,
          password: passwordHash,
          role: data.role ?? 'Player',
        });

        const saved = await this.users.save(user);
        span.setAttribute('user.id', saved.id);
        return saved;
      } catch (err) {
        if (err instanceof QueryFailedError && (err as any).driverError?.code === '23505') {
          throw new ConflictException('User already exists');
        }
        throw err;
      }
    });
  }

  async findById(id: string): Promise<UserEntity> {
    return withSpan('users.findById', async (span) => {
      span.setAttribute('user.id', id);
      const user = await this.users.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    });
  }

  async getProfile(id: string): Promise<UserProfile> {
    return withSpan('users.getProfile', (span) =>
      this.withUser(id, span, async (user) => ({
        username: user.username,
        email: user.email ?? '',
        avatarUrl: user.avatarKey ?? '',
        bank: user.bank ?? '',
        location: user.location ?? '',
        joined: user.joined?.toISOString() ?? new Date(0).toISOString(),
        bio: user.bio ?? '',
        experience: user.experience,
        balance: user.balance,
      })),
    );
  }

  async getStats(id: string): Promise<ProfileStatsResponse> {
    return withSpan('users.getStats', (span) =>
      this.withUser(id, span, async () => {
        const repo = this.users.manager.getRepository(Leaderboard);
        const lb = await repo.findOne({ where: { playerId: id } });

        const tournamentsPlayed = lb
          ? Object.values(lb.finishes || {}).reduce(
              (a, b) => a + (typeof b === 'number' ? b : 0),
              0,
            )
          : 0;

        const wins = lb?.finishes?.[1] ?? 0;
        const topThree =
          (lb?.finishes?.[1] ?? 0) + (lb?.finishes?.[2] ?? 0) + (lb?.finishes?.[3] ?? 0);

        const winRate = tournamentsPlayed ? (wins / tournamentsPlayed) * 100 : 0;
        const topThreeRate = tournamentsPlayed ? (topThree / tournamentsPlayed) * 100 : 0;

        return {
          handsPlayed: lb?.hands ?? 0,
          winRate,
          tournamentsPlayed,
          topThreeRate,
        };
      }),
    );
  }

  async update(id: string, data: UpdateUserRequest): Promise<UserEntity> {
    return withSpan('users.update', (span) =>
      this.withUser(id, span, async (user) => {
        Object.assign(user, data);
        return this.users.save(user);
      }),
    );
  }

  async ban(id: string): Promise<UserEntity> {
    return withSpan('users.ban', (span) =>
      this.withUser(id, span, async (user) => {
        user.banned = true;
        return this.users.save(user);
      }),
    );
  }

  async list(limit?: number): Promise<(UserEntity & { currency: string })[]> {
    return withSpan('users.list', async () => {
      const users = await this.users.find({
        order: { joined: 'DESC' },
        take: limit,
      });

      const accountRepo = this.users.manager.getRepository(Account);
      const accounts = await accountRepo.findBy({
        id: In(users.map((u) => u.id)),
      });

      const accountMap = new Map(accounts.map((a) => [a.id, a.currency]));
      return users.map((u) => ({ ...u, currency: accountMap.get(u.id) ?? 'USD' }));
    });
  }

  async reset() {
    return withSpan('users.reset', async () => {
      await this.users
        .createQueryBuilder()
        .delete()
        .from(this.users.metadata.target)
        .execute();
    });
  }
}
