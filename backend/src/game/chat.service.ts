import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../database/entities/chatMessage.entity';
import { Table } from '../database/entities/table.entity';
import { User } from '../database/entities/user.entity';
import type { ChatMessage as ChatMessageDto } from '@shared/types';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
  ) {}

  async appendMessage(
    tableId: string,
    userId: string,
    text: string,
  ): Promise<void> {
    const message = this.messages.create({
      table: { id: tableId } as Table,
      user: { id: userId } as User,
      message: text,
    });
    await this.messages.save(message);
  }

  async getRecentMessages(
    tableId: string,
    limit = 20,
  ): Promise<ChatMessageDto[]> {
    const rows = await this.messages.find({
      where: { table: { id: tableId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows
      .map((m) => ({
        id: m.id,
        username: m.user.username,
        avatar: m.user.avatarKey ?? '',
        text: m.message,
        time: m.createdAt.toISOString(),
      }))
      .reverse();
  }
}
