import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { BaseAuthGuard } from './base.guard';

interface AdminPayload {
  sub: string;
  role: string;
  [key: string]: unknown;
}

@Injectable()
export class AdminGuard extends BaseAuthGuard {
  constructor(private readonly config: ConfigService) {
    super();
  }

  protected validate(token: string) {
    const secrets = this.config.get<string[]>('auth.jwtSecrets', []);
    let payload: AdminPayload | null = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret) as AdminPayload;
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
    return { userId: payload.sub };
  }
}
