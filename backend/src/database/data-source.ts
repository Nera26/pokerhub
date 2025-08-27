import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Table } from './entities/table.entity';
import { Tournament } from './entities/tournament.entity';
import { User } from './entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Tournament, Table],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
