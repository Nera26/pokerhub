import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Table } from './entities/table.entity';
import { Tournament } from './entities/tournament.entity';
import { User } from './entities/user.entity';
import { Seat } from './entities/seat.entity';
import { Account } from '../wallet/account.entity';
import { JournalEntry } from '../wallet/journal-entry.entity';
import { SettlementJournal } from '../wallet/settlement-journal.entity';
import { Hand } from './entities/hand.entity';
import { AntiCheatFlag } from './entities/antiCheatFlag.entity';
import { KycVerification } from './entities/kycVerification.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Tournament,
    Table,
    Seat,
    Account,
    JournalEntry,
    SettlementJournal,
    Hand,
    AntiCheatFlag,
    KycVerification,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
