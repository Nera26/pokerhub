import { Injectable } from '@nestjs/common';
import type { Table } from '@shared/types';

interface TableInternal extends Omit<Table, 'createdAgo'> {
  createdAt: Date;
}

@Injectable()
export class TablesService {
  private readonly tables: TableInternal[] = [
    {
      id: '1',
      tableName: 'Test Table',
      gameType: 'texas',
      stakes: { small: 1, big: 2 },
      players: { current: 0, max: 6 },
      buyIn: { min: 40, max: 200 },
      stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
      createdAt: new Date(),
    },
  ];

  getTables(): Table[] {
    const now = Date.now();
    return this.tables.map((t) => ({
      ...t,
      createdAgo: this.formatAgo(now - t.createdAt.getTime()),
    }));
  }

  private formatAgo(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }
}
