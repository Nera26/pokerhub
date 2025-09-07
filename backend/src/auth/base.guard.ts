/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { extractBearerToken } from './token.util';

interface ValidationResult {
  userId: string;
  extra?: unknown;
}

export abstract class BaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = extractBearerToken(context);
    const { userId } = await this.validate(token);
    if (context.getType() === 'ws') {
      const client = context
        .switchToWs()
        .getClient<Socket & { data: Record<string, unknown> }>();
      client.data = client.data ?? {};
      client.data.userId = userId;
    } else {
      const req = context.switchToHttp().getRequest<{ userId?: string }>();
      req.userId = userId;
    }
    return true;
  }

  protected abstract validate(
    token: string,
  ): ValidationResult | Promise<ValidationResult>;
}
