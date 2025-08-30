import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  BadRequestException,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  CreateUserSchema,
  type CreateUserRequest,
  UpdateUserSchema,
  type UpdateUserRequest,
  BanUserSchema,
  type BanUserRequest,
  BalanceAdjustmentSchema,
  type BalanceAdjustmentRequest,
  UserSchema,
  type User,
} from '../schemas/users';
import { ZodError } from 'zod';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  async create(@Body() body: CreateUserRequest): Promise<User> {
    try {
      const parsed = CreateUserSchema.parse(body);
      const user = await this.users.create(parsed);
      return UserSchema.parse(user);
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
      const user = await this.users.update(id, parsed);
      return UserSchema.parse(user);
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
      BanUserSchema.parse(body);
      const user = await this.users.ban(id);
      return UserSchema.parse(user);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post(':id/balance')
  @HttpCode(200)
  async adjustBalance(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: BalanceAdjustmentRequest,
  ): Promise<User> {
    try {
      const parsed = BalanceAdjustmentSchema.parse(body);
      const user = await this.users.adjustBalance(id, parsed.amount);
      return UserSchema.parse(user);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}

