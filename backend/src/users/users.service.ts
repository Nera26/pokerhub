import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { trace, Span } from '@opentelemetry/api';
import { CreateUserRequest, UpdateUserRequest, User } from '../schemas/users';
import { UserRepository } from './user.repository';
import { QueryFailedError } from 'typeorm';

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

