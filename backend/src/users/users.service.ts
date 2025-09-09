import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { trace, Span } from '@opentelemetry/api';
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  type UserProfile,
  type ProfileStatsResponse,
} from '@shared/types';
import { UserRepository } from './user.repository';
import { QueryFailedError } from 'typeorm';
import { Leaderboard } from '../database/entities/leaderboard.entity';

@Injectable()
export class UsersService {
  private static readonly tracer = trace.getTracer('users');

  constructor(private readonly users: UserRepository) {}

  private async withUser<T>(
    id: string,
    span: Span,
    fn: (user: User) => Promise<T>,
  ): Promise<T> {
    span.setAttribute('user.id', id);
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      span.end();
      throw new NotFoundException('User not found');
    }
    try {
      return await fn(user);
    } finally {
      span.end();
    }
  }

  async create(data: CreateUserRequest): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.create',
      async (span) => {
        try {
          const user = this.users.create({
            username: data.username,
            avatarKey: data.avatarKey,
            banned: false,
          });
          const saved = await this.users.save(user);
          span.setAttribute('user.id', saved.id);
          span.end();
          return saved;
        } catch (err) {
          span.end();
          if (
            err instanceof QueryFailedError &&
            (err as any).driverError?.code === '23505'
          ) {
            throw new ConflictException('User already exists');
          }
          throw err;
        }
      },
    );
  }

  async findById(id: string): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.findById',
      async (span) => {
        span.setAttribute('user.id', id);
        const user = await this.users.findOne({ where: { id } });
        span.end();
        if (!user) {
          throw new NotFoundException('User not found');
        }
        return user;
      },
    );
  }

  async getProfile(id: string): Promise<UserProfile> {
    return UsersService.tracer.startActiveSpan(
      'users.getProfile',
      async (span) => {
        return this.withUser(id, span, async (user) => {
          return {
            username: user.username,
            email: user.email ?? '',
            avatarUrl: user.avatarKey ?? '',
            bank: user.bank ?? '',
            location: user.location ?? '',
            joined: user.joined?.toISOString() ?? new Date(0).toISOString(),
            bio: user.bio ?? '',
            experience: user.experience,
            balance: user.balance,
          };
        });
      },
    );
  }

  async getStats(id: string): Promise<ProfileStatsResponse> {
    return UsersService.tracer.startActiveSpan(
      'users.getStats',
      async (span) => {
        return this.withUser(id, span, async () => {
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
            (lb?.finishes?.[1] ?? 0) +
            (lb?.finishes?.[2] ?? 0) +
            (lb?.finishes?.[3] ?? 0);
          const winRate = tournamentsPlayed
            ? (wins / tournamentsPlayed) * 100
            : 0;
          const topThreeRate = tournamentsPlayed
            ? (topThree / tournamentsPlayed) * 100
            : 0;
          return {
            handsPlayed: lb?.hands ?? 0,
            winRate,
            tournamentsPlayed,
            topThreeRate,
          };
        });
      },
    );
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.update',
      async (span) => {
        return this.withUser(id, span, async (user) => {
          Object.assign(user, data);
          return this.users.save(user);
        });
      },
    );
  }

  async ban(id: string): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.ban',
      async (span) => {
        return this.withUser(id, span, async (user) => {
          user.banned = true;
          return this.users.save(user);
        });
      },
    );
  }

  async list(limit?: number): Promise<User[]> {
    return UsersService.tracer.startActiveSpan(
      'users.list',
      async (span) => {
        const users = await this.users.find({
          order: { joined: 'DESC' },
          take: limit,
        });
        span.end();
        return users;
      },
    );
  }

  async reset() {
    return UsersService.tracer.startActiveSpan('users.reset', async (span) => {
      await this.users
        .createQueryBuilder()
        .delete()
        .from(this.users.metadata.target)
        .execute();
      span.end();
    });
  }
}

