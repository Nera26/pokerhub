import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';

interface UserRecord {
  id: string;
  password: string;
}

@Injectable()
export class AuthService {
  private users = new Map<string, UserRecord>();

  constructor(private readonly sessions: SessionService) {
    this.users.set('user@example.com', { id: '1', password: 'secret' });
  }

  private async validateUser(email: string, password: string): Promise<string | null> {
    const user = this.users.get(email);
    if (!user || user.password !== password) return null;
    return user.id;
  }

  async login(email: string, password: string) {
    const userId = await this.validateUser(email, password);
    if (!userId) return null;
    return this.sessions.issueTokens(userId);
  }
}
