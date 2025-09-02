import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  BadRequestException,
  ParseUUIDPipe,
  HttpCode,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import type { Request } from 'express';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  private parseUser(user: any): User {
    return UserSchema.parse({
      ...user,
      avatarKey: user.avatarKey ?? undefined,
    });
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'The user' })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<User> {
    try {
      if (req.userId !== id) {
        throw new ForbiddenException();
      }
      const user = await this.users.findById(id);
      return this.parseUser(user);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserRequest,
    @Req() req: Request,
  ): Promise<User> {
    try {
      if (req.userId !== id) {
        throw new ForbiddenException();
      }
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
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned' })
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

