import { User } from '../../src/database/entities/user.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Tournament } from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import testDataSource from '../utils/test-datasource';
import { destroyDataSource } from '../utils/pgMem';

describe('Entity relations', () => {
  beforeAll(async () => {
    testDataSource.setOptions({
      entities: [User, Table, Seat, Tournament],
      synchronize: true,
    });
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
  });

  afterAll(async () => {
    await destroyDataSource(testDataSource);
  });

  it('relates tables, tournaments and users', async () => {
    const tournamentRepo = testDataSource.getRepository(Tournament);
    const tableRepo = testDataSource.getRepository(Table);
    const userRepo = testDataSource.getRepository(User);

    const tournament = tournamentRepo.create({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Main Event',
      buyIn: 0,
      prizePool: 0,
      maxPlayers: 0,
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
