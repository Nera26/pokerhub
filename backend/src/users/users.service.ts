import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserRequest, UpdateUserRequest, User } from '../schemas/users';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async create(data: CreateUserRequest): Promise<User> {
    const user = this.users.create({
      username: data.username,
      avatarKey: data.avatarKey,
      banned: false,
      balance: 0,
    });
    return this.users.save(user);
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, data);
    return this.users.save(user);
  }

  async ban(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.banned = true;
    return this.users.save(user);
  }

  async adjustBalance(id: string, amount: number): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.balance += amount;
    return this.users.save(user);
  }

  async reset() {
    await this.users.createQueryBuilder().delete().from(this.users.metadata.target).execute();
  }
}

