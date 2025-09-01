import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({ where: { userId }, order: { timestamp: 'DESC' } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId }, { read: true });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { read: true });
  }
}

