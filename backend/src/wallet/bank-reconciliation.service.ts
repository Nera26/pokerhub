import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingDeposit } from './pending-deposit.entity';
import { WalletService } from './wallet.service';

export interface BankEntry {
  reference: string;
  amount: number;
}

@Injectable()
export class BankReconciliationService {
  private readonly logger = new Logger(BankReconciliationService.name);

  constructor(
    @InjectRepository(PendingDeposit)
    private readonly pendingDeposits: Repository<PendingDeposit>,
    private readonly wallet: WalletService,
  ) {}

  async reconcile(entries: BankEntry[]): Promise<void> {
    for (const entry of entries) {
      const deposit = await this.pendingDeposits.findOne({
        where: {
          reference: entry.reference,
          amount: entry.amount,
          status: 'pending',
        },
      });
      if (deposit) {
        await this.wallet.confirmPendingDeposit(deposit.id, 'system');
      } else {
        this.logger.warn(
          { reference: entry.reference, amount: entry.amount },
          'unmatched bank entry',
        );
      }
    }
  }

  async reconcileApi(entries: BankEntry[]): Promise<void> {
    await this.reconcile(entries);
  }

  async reconcileCsv(csv: string): Promise<void> {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return;
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const refIdx = headers.indexOf('reference');
    const amtIdx = headers.indexOf('amount');
    if (refIdx === -1 || amtIdx === -1) {
      this.logger.warn('missing required columns in CSV');
      return;
    }
    const entries: BankEntry[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(',');
      const reference = cols[refIdx]?.trim();
      const amount = Number(cols[amtIdx]);
      if (!reference || Number.isNaN(amount)) {
        this.logger.warn({ line }, 'invalid csv row');
        continue;
      }
      entries.push({ reference, amount });
    }
    await this.reconcile(entries);
  }
}
