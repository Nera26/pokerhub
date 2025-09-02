import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { newDb } from 'pg-mem';
import { Table } from './entities/table.entity';
import { Tournament } from './entities/tournament.entity';
import { User } from './entities/user.entity';
import { AntiCheatFlag } from './entities/antiCheatFlag.entity';
import { KycVerification } from './entities/kycVerification.entity';
import { Seat } from './entities/seat.entity';
import { ChatMessage } from './entities/chatMessage.entity';
import { Leaderboard } from './entities/leaderboard.entity';

const entities = [
  User,
  Tournament,
  Table,
  Seat,
  AntiCheatFlag,
  KycVerification,
  ChatMessage,
  Leaderboard,
];
let dataSource: DataSource;

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (!process.env.DATABASE_URL) {
          const db = newDb();
          db.public.registerFunction({
            name: 'version',
            returns: 'text',
            implementation: () => 'pg-mem',
          });
          db.public.registerFunction({
            name: 'current_database',
            returns: 'text',
            implementation: () => 'test',
          });
          db.public.registerFunction({
            name: 'uuid_generate_v4',
            returns: 'text',
            implementation: () => '00000000-0000-0000-0000-000000000000',
          });
          dataSource = db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities,
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        }
        return {
          type: 'postgres',
          url: process.env.DATABASE_URL,
          entities,
          synchronize: false,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
        } as DataSourceOptions;
      },
      dataSourceFactory: async (options: DataSourceOptions) => {
        if (dataSource) {
          return dataSource.initialize();
        }
        return new DataSource(options).initialize();
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
