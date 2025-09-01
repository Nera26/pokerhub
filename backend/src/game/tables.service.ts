import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table as TableEntity } from '../database/entities/table.entity';
import type {
  Table as TableDto,
  TableData,
  CreateTableRequest,
  UpdateTableRequest,
} from '../schemas/tables';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tables: Repository<TableEntity>,
  ) {}

  async getTables(): Promise<TableDto[]> {
    const now = Date.now();
    const all = await this.tables.find();
    return all.map((t) => this.toDto(t, now));
  }

  async getTable(id: string): Promise<TableData> {
    const table = await this.tables.findOne({ where: { id } });
    if (!table) {
      throw new Error('Table not found');
    }
    return {
      smallBlind: table.smallBlind,
      bigBlind: table.bigBlind,
      pot: 0,
      communityCards: [],
      players: [],
      chatMessages: [],
    };
  }

  async createTable(data: CreateTableRequest): Promise<TableDto> {
    const table = this.tables.create({
      name: data.tableName,
      gameType: data.gameType,
      smallBlind: data.stakes.small,
      bigBlind: data.stakes.big,
      startingStack: data.startingStack,
      playersMax: data.players.max,
      minBuyIn: data.buyIn.min,
      maxBuyIn: data.buyIn.max,
    });
    const saved = await this.tables.save(table);
    return this.toDto(saved);
  }

  async updateTable(id: string, data: UpdateTableRequest): Promise<TableDto> {
    const table = await this.tables.findOne({ where: { id } });
    if (!table) {
      throw new Error('Table not found');
    }
    if (data.tableName !== undefined) table.name = data.tableName;
    if (data.gameType !== undefined) table.gameType = data.gameType;
    if (data.stakes?.small !== undefined) table.smallBlind = data.stakes.small;
    if (data.stakes?.big !== undefined) table.bigBlind = data.stakes.big;
    if (data.startingStack !== undefined)
      table.startingStack = data.startingStack;
    if (data.players?.max !== undefined) table.playersMax = data.players.max;
    if (data.buyIn?.min !== undefined) table.minBuyIn = data.buyIn.min;
    if (data.buyIn?.max !== undefined) table.maxBuyIn = data.buyIn.max;
    const saved = await this.tables.save(table);
    return this.toDto(saved);
  }

  async deleteTable(id: string): Promise<void> {
    await this.tables.delete(id);
  }

  private toDto(t: TableEntity, now = Date.now()): TableDto {
    return {
      id: t.id,
      tableName: t.name,
      gameType: t.gameType as any,
      stakes: { small: t.smallBlind, big: t.bigBlind },
      players: { current: t.playersCurrent, max: t.playersMax },
      buyIn: { min: t.minBuyIn, max: t.maxBuyIn },
      stats: {
        handsPerHour: t.handsPerHour,
        avgPot: t.avgPot,
        rake: t.rake,
      },
      createdAgo: this.formatAgo(now - t.createdAt.getTime()),
    };
  }

  private formatAgo(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }
}
