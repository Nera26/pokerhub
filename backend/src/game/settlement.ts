export interface SettlementEntry {
  playerId: string;
  delta: number;
}

export class SettlementJournal {
  private readonly entries: SettlementEntry[] = [];

  record(entry: SettlementEntry) {
    this.entries.push(entry);
  }

  getAll(): SettlementEntry[] {
    return [...this.entries];
  }
}
