import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '../database/entities/user.entity';
import { CollusionService } from '../analytics/collusion.service';
import { CollusionAudit } from '../analytics/collusion-audit.entity';

type SeedUserRole = 'Admin' | 'Player';

@Injectable()
export class TestSupportService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CollusionAudit)
    private readonly audits: Repository<CollusionAudit>,
    private readonly collusion: CollusionService,
  ) {}

  async ensureUser(params: {
    email: string;
    password: string;
    role?: SeedUserRole;
  }): Promise<User> {
    const { email, password, role } = params;
    const existing = await this.users.findOne({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      existing.email = email;
      existing.username = existing.username ?? email;
      existing.password = passwordHash;
      existing.role = role ?? existing.role ?? 'Player';
      return this.users.save(existing);
    }
    const user = this.users.create({
      email,
      username: email,
      password: passwordHash,
      role: role ?? 'Player',
    });
    return this.users.save(user);
  }

  async seedCollusionFlag(params: {
    sessionId?: string;
    users?: string[];
    features?: Record<string, unknown>;
  }): Promise<{ sessionId: string; users: string[] }> {
    const sessionId = params.sessionId ?? randomUUID();
    const users = params.users ?? ['player-a', 'player-b'];
    await this.collusion.flagSession(sessionId, users, params.features ?? {});
    return { sessionId, users };
  }

  async deleteCollusion(sessionId: string): Promise<void> {
    await this.audits.delete({ sessionId });
  }
}
