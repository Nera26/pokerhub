import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  BadRequestException,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { ZodError } from 'zod';
import {
  CreateUserSchema,
  type CreateUserRequest,
  UpdateUserSchema,
  type UpdateUserRequest,
  BanUserSchema,
  type BanUserRequest,
  UserSchema,
  type User,
} from '../schemas/users';
import { UsersService } from '../users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  private parseUser(user: any): User {
    return UserSchema.parse({
      ...user,
      avatarKey: user.avatarKey ?? undefined,
    });
  }

  @Post()
  async create(@Body() body: CreateUserRequest): Promise<User> {
    try {
      const parsed = CreateUserSchema.parse(body);
      const created = await this.users.create(parsed);
      return this.parseUser(created);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserRequest,
  ): Promise<User> {
    try {
      const parsed = UpdateUserSchema.parse(body);
      const updated = await this.users.update(id, parsed);
      return this.parseUser(updated);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post(':id/ban')
  @HttpCode(200)
  async ban(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: BanUserRequest,
  ): Promise<User> {
    try {
      BanUserSchema.parse(body ?? {});
      const banned = await this.users.ban(id);
      return this.parseUser(banned);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

}

