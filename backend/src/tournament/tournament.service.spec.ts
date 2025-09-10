import { TournamentService } from './tournament.service';
import { createTournamentModule } from '../../test/utils/createTournamentModule';

describe('TournamentService get', () => {
  let service: TournamentService;
  const tournaments: any = { findOne: jest.fn() };
  const seats: any = { count: jest.fn(), exists: jest.fn() };

  beforeEach(async () => {
    ({ service } = await createTournamentModule({ tournaments, seats }));
  });

  it('returns overview structure and prizes', async () => {
    tournaments.findOne.mockResolvedValue({
      id: 't1',
      title: 'Spring',
      buyIn: 100,
      currency: 'USD',
      prizePool: 1000,
      state: 'REG_OPEN',
      maxPlayers: 100,
      registrationOpen: null,
      registrationClose: null,
    });
    seats.count.mockResolvedValue(0);
    seats.exists.mockResolvedValue(false);

    const result = await service.get('t1', 'u1');
    expect(result.overview).toBeDefined();
    expect(result.structure).toBeDefined();
    expect(result.prizes).toBeDefined();
  });
});
