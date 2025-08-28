import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  BadRequestException,
  HttpCode,
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
  create(@Body() body: CreateUserRequest): User {
    try {
      const parsed = CreateUserSchema.parse(body);
      const user = this.users.create(parsed);
      return UserSchema.parse(user);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserRequest,
  ): User {
    try {
      const parsed = UpdateUserSchema.parse(body);
      const user = this.users.update(id, parsed);
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
  ban(@Param('id') id: string, @Body() body: BanUserRequest): User {
    try {
      BanUserSchema.parse(body);
      const user = this.users.ban(id);
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
  adjustBalance(
    @Param('id') id: string,
    @Body() body: BalanceAdjustmentRequest,
  ): User {
    try {
      const parsed = BalanceAdjustmentSchema.parse(body);
      const user = this.users.adjustBalance(id, parsed.amount);
      return UserSchema.parse(user);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}

