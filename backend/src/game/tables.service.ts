import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Table as TableEntity } from '../database/entities/table.entity';
import { User } from '../database/entities/user.entity';
import { RoomManager } from './room.service';
import { ChatService } from './chat.service';
import type {
  Table as TableDto,
  TableData,
  TableState,
  CreateTableRequest,
  UpdateTableRequest,
  TabKey,
} from '../schemas/tables';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity)
    private readonly tables: Repository<TableEntity>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly rooms: RoomManager,
    private readonly chat: ChatService,
  ) {}

  async getTables(status?: string): Promise<TableDto[]> {
    const now = Date.now();
    const all = await this.tables.find();
    const filtered =
      status === 'active'
        ? all.filter((t) => t.playersCurrent > 0)
        : all;
    return filtered.map((t) => this.toDto(t, now));
  }

  async getTable(id: string): Promise<TableData> {
    const table = await this.tables.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    let pot = 0;
    let communityCards: string[] = [];
    let players: TableData['players'] = [];
    let chatMessages: TableData['chatMessages'] = [];
    let stateAvailable = true;

    try {
      const room = this.rooms.get(id);
      const state = await room.getPublicState();
      pot = state.pot;
      communityCards = state.communityCards.map((c) => this.cardToString(c));
      const userIds = state.players.map((p) => p.id);
      const userEntities = await this.users.findBy({ id: In(userIds) });
      const userMap = new Map(userEntities.map((u) => [u.id, u]));
      players = state.players.map((p, idx) => {
        const user = userMap.get(p.id);
        return {
          id: idx + 1,
          username: user?.username ?? p.id,
          avatar: user?.avatarKey ?? '',
          chips: p.stack,
          committed: p.bet,
          isFolded: p.folded,
          isAllIn: p.allIn,
        };
      });
      chatMessages = await this.chat.getRecentMessages(id);
    } catch {
      // Fallback to empty state if room not available or state fetch fails
      stateAvailable = false;
    }

    return {
      smallBlind: table.smallBlind,
      bigBlind: table.bigBlind,
      pot,
      communityCards,
      players,
      chatMessages,
      stateAvailable,
    };
  }

  async getTableState(id: string): Promise<TableState> {
    let pot = 0;
    let sidePots: number[] = [];
    let seats: TableState['seats'] = [];
    let street: TableState['street'] = 'pre';
    let handId = '';

    try {
      const room = this.rooms.get(id);
      const state = await room.getPublicState();
      pot = state.pot;
      sidePots = state.sidePots.map((s) => s.amount);
      street = this.mapStreet(state.street);
      const userIds = state.players.map((p) => p.id);
      const userEntities = await this.users.findBy({ id: In(userIds) });
      const userMap = new Map(userEntities.map((u) => [u.id, u]));
      seats = state.players.map((p, idx) => {
        const user = userMap.get(p.id);
        return {
          id: idx + 1,
          name: user?.username ?? p.id,
          avatar: user?.avatarKey ?? '',
          balance: p.stack,
          inHand: !p.folded,
        };
      });
    } catch {
      // fallback to defaults if room/state unavailable
    }

    return { handId, seats, pot: { main: pot, sidePots }, street };
  }

  async getSidePanelTabs(id: string): Promise<TabKey[]> {
    const table = await this.tables.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    return table.tabs ?? ['history', 'chat', 'notes'];
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

  private cardToString(card: number): string {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['♣', '♦', '♥', '♠'];
    const rank = ranks[Math.floor(card / 4)] ?? '?';
    const suit = suits[card % 4] ?? '?';
    return `${rank}${suit}`;
  }

  private mapStreet(street: string): TableState['street'] {
    switch (street) {
      case 'flop':
        return 'flop';
      case 'turn':
        return 'turn';
      case 'river':
      case 'showdown':
        return 'river';
      default:
        return 'pre';
    }
  }
}
