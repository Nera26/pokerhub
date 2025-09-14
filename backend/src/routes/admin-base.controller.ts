import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

export function AdminController(path: string): ClassDecorator {
  return applyDecorators(
    ApiTags('admin'),
    UseGuards(AuthGuard, AdminGuard),
    Controller(`admin/${path}`),
  );
}
