import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminMessageEntity } from './admin-message.entity';
import type { AdminMessage } from '../schemas/messages';

@Injectable()
export class AdminMessagesService {
  constructor(
    @InjectRepository(AdminMessageEntity)
    private readonly repo: Repository<AdminMessageEntity>,
  ) {}

  async list(): Promise<AdminMessage[]> {
    const items = await this.repo.find({ order: { time: 'DESC' } });
    return items.map((m) => this.toDto(m));
  }

  async find(id: number): Promise<AdminMessage | null> {
    const item = await this.repo.findOne({ where: { id } });
    return item ? this.toDto(item) : null;
  }

  async markRead(id: number): Promise<void> {
    await this.repo.update(id, { read: true });
  }

  private toDto(entity: AdminMessageEntity): AdminMessage {
    return {
      id: entity.id,
      sender: entity.sender,
      userId: entity.userId,
      avatar: entity.avatar,
      subject: entity.subject,
      preview: entity.preview,
      content: entity.content,
      time: entity.time.toISOString(),
      read: entity.read,
    };
  }
}

