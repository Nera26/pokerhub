import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Socket } from 'socket.io';
import { SessionService } from '../session/session.service';
import { extractBearerToken } from './token.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const token = extractBearerToken(context);
    const userId = this.sessions.verifyAccessToken(token);
    if (!userId) {
      throw new UnauthorizedException();
    }

    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<Socket & { data: any }>();
      client.data = client.data ?? {};
      client.data.userId = userId;
    } else {
      const req = context.switchToHttp().getRequest();
      req.userId = userId;
    }
    return true;
  }
}
