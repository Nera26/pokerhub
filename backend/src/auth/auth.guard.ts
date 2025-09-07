import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { BaseAuthGuard } from './base.guard';

@Injectable()
export class AuthGuard extends BaseAuthGuard {
  constructor(private readonly sessions: SessionService) {
    super();
  }

  protected validate(token: string) {
    const userId = this.sessions.verifyAccessToken(token);
    if (!userId) {
      throw new UnauthorizedException();
    }
    return { userId };
  }
}
