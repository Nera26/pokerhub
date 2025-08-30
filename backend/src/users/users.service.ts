import { Injectable, NotFoundException } from '@nestjs/common';
import { trace, metrics } from '@opentelemetry/api';
import { CreateUserRequest, UpdateUserRequest, User } from '../schemas/users';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  private static readonly tracer = trace.getTracer('users');
  private static readonly meter = metrics.getMeter('users');
  private static readonly balanceAdjustments = UsersService.meter.createCounter(
    'user_balance_adjustments_total',
    { description: 'Number of balance adjustment operations' },
  );

  constructor(private readonly users: UserRepository) {}

  async create(data: CreateUserRequest): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.create',
      async (span) => {
        const user = this.users.create({
          username: data.username,
          avatarKey: data.avatarKey,
          banned: false,
          balance: 0,
        });
        const saved = await this.users.save(user);
        span.setAttribute('user.id', saved.id);
        span.end();
        return saved;
      },
    );
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.update',
      async (span) => {
        span.setAttribute('user.id', id);
        const user = await this.users.findOne({ where: { id } });
        if (!user) {
          span.end();
          throw new NotFoundException('User not found');
        }
        Object.assign(user, data);
        const saved = await this.users.save(user);
        span.end();
        return saved;
      },
    );
  }

  async ban(id: string): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.ban',
      async (span) => {
        span.setAttribute('user.id', id);
        const user = await this.users.findOne({ where: { id } });
        if (!user) {
          span.end();
          throw new NotFoundException('User not found');
        }
        user.banned = true;
        const saved = await this.users.save(user);
        span.end();
        return saved;
      },
    );
  }

  async adjustBalance(id: string, amount: number): Promise<User> {
    return UsersService.tracer.startActiveSpan(
      'users.adjustBalance',
      async (span) => {
        span.setAttribute('user.id', id);
        span.setAttribute('amount', amount);
        const user = await this.users.findOne({ where: { id } });
        if (!user) {
          span.end();
          throw new NotFoundException('User not found');
        }
        user.balance += amount;
        UsersService.balanceAdjustments.add(1);
        const saved = await this.users.save(user);
        span.end();
        return saved;
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

