import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { User } from '../../src/database/entities/user.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';

describe('Entity relations', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
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
      entities: [User, Table, Tournament],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('relates tables, tournaments and users', async () => {
    const tournamentRepo = dataSource.getRepository(Tournament);
    const tableRepo = dataSource.getRepository(Table);
    const userRepo = dataSource.getRepository(User);

    const tournament = tournamentRepo.create({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Main Event',
    });
    await tournamentRepo.save(tournament);

    const user = userRepo.create({
      id: '22222222-2222-2222-2222-222222222222',
      username: 'Alice',
    });
    await userRepo.save(user);

    const table = tableRepo.create({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Table 1',
      tournament,
      players: [user],
    });
    await tableRepo.save(table);

    const loaded = await tableRepo.findOne({
      where: { id: '33333333-3333-3333-3333-333333333333' },
      relations: ['tournament', 'players'],
    });

    expect(loaded?.tournament.id).toBe(tournament.id);
    expect(loaded?.players).toHaveLength(1);
    expect(loaded?.players[0].id).toBe(user.id);
  });
});
