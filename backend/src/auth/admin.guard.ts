import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { extractBearerToken } from './token.util';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const token = extractBearerToken(context);
    const secrets = this.config.get<string[]>('auth.jwtSecrets', []);
    let payload: any = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret) as any;
        break;
      } catch {
        continue;
      }
    }
    if (!payload) {
      throw new UnauthorizedException();
    }
    if (payload.role !== 'admin') {
      throw new ForbiddenException();
    }
    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<Socket & { data: any }>();
      client.data = client.data ?? {};
      client.data.userId = payload.sub;
    } else {
      const req = context.switchToHttp().getRequest();
      req.userId = payload.sub;
    }
    return true;
  }
}
