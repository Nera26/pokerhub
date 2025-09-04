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

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const header =
      context.getType() === 'ws'
        ? context.switchToWs().getClient<Socket>().handshake?.headers?.[
            'authorization'
          ]
        : context.switchToHttp().getRequest().headers['authorization'];
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.slice(7);
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
