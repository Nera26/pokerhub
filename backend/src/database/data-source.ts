import 'dotenv/config';
import path from 'path';
import { DataSource } from 'typeorm';
import { Table } from './entities/table.entity';
import { Tournament } from './entities/tournament.entity';
import { User } from './entities/user.entity';
import { Seat } from './entities/seat.entity';
import { Account } from '../wallet/account.entity';
import { JournalEntry } from '../wallet/journal-entry.entity';
import { SettlementJournal } from '../wallet/settlement-journal.entity';
import { Disbursement } from '../wallet/disbursement.entity';
import { Notification } from '../notifications/notification.entity';
import { WithdrawalDecision } from '../withdrawals/withdrawal-decision.entity';
import { Hand } from './entities/hand.entity';
import { AntiCheatFlag } from './entities/antiCheatFlag.entity';
import { KycVerification } from './entities/kycVerification.entity';
import { ChatMessage } from './entities/chatMessage.entity';
import { GameState } from './entities/game-state.entity';
import { CollusionAudit } from '../analytics/collusion-audit.entity';
import { Tier } from './entities/tier.entity';
import { BroadcastEntity } from './entities/broadcast.entity';
import { BroadcastTypeEntity } from './entities/broadcast-type.entity';
import { BroadcastTemplateEntity } from './entities/broadcast-template.entity';
import { TranslationEntity } from './entities/translation.entity';

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
    Disbursement,
    Notification,
    WithdrawalDecision,
    Hand,
    AntiCheatFlag,
    KycVerification,
    ChatMessage,
    GameState,
    CollusionAudit,
    Tier,
    BroadcastEntity,
    BroadcastTypeEntity,
    BroadcastTemplateEntity,
    TranslationEntity,
  ],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
});
