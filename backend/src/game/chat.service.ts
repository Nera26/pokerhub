import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../database/entities/chatMessage.entity';
import { Table } from '../database/entities/table.entity';
import { User } from '../database/entities/user.entity';
import type { ChatMessage as ChatMessageDto } from '@shared/types';
import { GameGateway } from './game.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    private readonly gateway: GameGateway,
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
    const saved = await this.messages.save(message);
    const row = await this.messages.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
    if (row) {
      const dto: ChatMessageDto = {
        id: row.id,
        username: row.user.username,
        avatar: row.user.avatarKey ?? '',
        text: row.message,
        time: row.createdAt.toISOString(),
      };
      this.gateway.server.to(tableId).emit('chat:message', dto);
    }
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
