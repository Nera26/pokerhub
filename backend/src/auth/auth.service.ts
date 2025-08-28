import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

interface UserRecord {
  id: string;
  password: string;
}

@Injectable()
export class AuthService {
  private users = new Map<string, UserRecord>();

  constructor(private readonly sessions: SessionService) {
    const hash = bcrypt.hashSync('secret', 10);
    this.users.set('user@example.com', { id: '1', password: hash });
  }

  async register(email: string, password: string) {
    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    this.users.set(email, { id, password: hash });
    return id;
  }

  private async validateUser(email: string, password: string): Promise<string | null> {
    const user = this.users.get(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return user.id;
  }

  async login(email: string, password: string) {
    const userId = await this.validateUser(email, password);
    if (!userId) return null;
    return this.sessions.issueTokens(userId);
  }
}
