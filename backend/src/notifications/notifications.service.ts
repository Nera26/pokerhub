import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import type { NotificationFilter, NotificationType } from '../schemas/notifications';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  private static readonly typeLabels: Record<NotificationType, string> = {
    bonus: 'Bonuses',
    tournament: 'Tournaments',
    system: 'System',
  };

  findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({ where: { userId }, order: { timestamp: 'DESC' } });
  }

  async getFilterOptions(userId: string): Promise<NotificationFilter[]> {
    const rows = await this.repo
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .orderBy('notification.type', 'ASC')
      .getRawMany<{ type: NotificationType }>();

    return rows.map(({ type }) => ({
      value: type,
      label: NotificationsService.typeLabels[type] ?? type,
    }));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId }, { read: true });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.repo.update({ id, userId }, { read: true });
  }

  countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, read: false } });
  }
}

