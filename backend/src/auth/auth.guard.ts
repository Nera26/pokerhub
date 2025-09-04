import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Socket } from 'socket.io';
import { SessionService } from '../session/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<Socket & { data: any }>();
      const header = client.handshake?.headers?.['authorization'];
      if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
        throw new UnauthorizedException();
      }
      const token = header.slice(7);
      const userId = this.sessions.verifyAccessToken(token);
      if (!userId) {
        throw new UnauthorizedException();
      }
      client.data = client.data ?? {};
      client.data.userId = userId;
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'];
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.slice(7);
    const userId = this.sessions.verifyAccessToken(token);
    if (!userId) {
      throw new UnauthorizedException();
    }
    req.userId = userId;
    return true;
  }
}
