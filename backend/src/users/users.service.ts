import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from '../schemas/users';

@Injectable()
export class UsersService {
  private users = new Map<string, User>();

  create(data: CreateUserRequest): User {
    const user: User = {
      id: randomUUID(),
      username: data.username,
      avatarKey: data.avatarKey,
      banned: false,
      balance: 0,
    };
    this.users.set(user.id, user);
    return user;
  }

  update(id: string, data: UpdateUserRequest): User {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, data);
    return user;
  }

  ban(id: string): User {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('User not found');
    user.banned = true;
    return user;
  }

  adjustBalance(id: string, amount: number): User {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('User not found');
    user.balance += amount;
    return user;
  }

  reset() {
    this.users.clear();
  }
}

