import { TournamentService } from '../../src/tournament/tournament.service';
import { TournamentState } from '../../src/database/entities/tournament.entity';
import { TournamentDetailType } from '../../src/tournament/tournament-detail.entity';

describe('TournamentService.get tournament details', () => {
  const baseTournament = {
    id: 't1',
    title: 'Sunday Major',
    buyIn: 100,
    currency: 'USD',
    gameType: 'texas',
    prizePool: 10000,
    state: TournamentState.REG_OPEN,
    maxPlayers: 100,
    registrationOpen: null as Date | null,
    registrationClose: null as Date | null,
  };

  function createService(detailRows: any[] = []) {
    const seats = {
      count: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
    };
    const detailsRepository = {
      find: jest.fn().mockResolvedValue(detailRows),
    };
    const service = new TournamentService(
      { findOne: jest.fn() } as any,
      seats as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      detailsRepository as any,
    );

    jest
      .spyOn(service as any, 'getEntity')
      .mockResolvedValue({ ...baseTournament });

    return { service, seats, detailsRepository };
  }

  it('returns empty detail arrays when none are stored', async () => {
    const { service, detailsRepository } = createService();
    const result = await service.get('t1');

    expect(detailsRepository.find).toHaveBeenCalledWith({
      where: { tournamentId: 't1' },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    expect(result.overview).toEqual([]);
    expect(result.structure).toEqual([]);
    expect(result.prizes).toEqual([]);
  });

  it('groups persisted rows by section and preserves order', async () => {
    const detailRows = [
      {
        id: 'd3',
        type: TournamentDetailType.PRIZES,
        sortOrder: 2,
        title: 'Runner-up',
        description: '$2,500 cash',
      },
      {
        id: 'd1',
        type: TournamentDetailType.OVERVIEW,
        sortOrder: 2,
        title: 'Re-entry',
        description: 'Single re-entry available.',
      },
      {
        id: 'd2',
        type: TournamentDetailType.OVERVIEW,
        sortOrder: 1,
        title: 'Format',
        description: 'No-Limit Hold\'em, 20k chips.',
      },
      {
        id: 'd4',
        type: TournamentDetailType.PRIZES,
        sortOrder: 1,
        title: 'Champion',
        description: '$5,000 cash',
      },
      {
        id: 'd5',
        type: TournamentDetailType.STRUCTURE,
        sortOrder: 1,
        title: 'Blind Levels',
        description: '20-minute levels throughout.',
      },
    ];

    const { service } = createService(detailRows);

    const result = await service.get('t1');

    expect(result.overview).toEqual([
      {
        title: 'Format',
        description: 'No-Limit Hold\'em, 20k chips.',
      },
      {
        title: 'Re-entry',
        description: 'Single re-entry available.',
      },
    ]);
    expect(result.structure).toEqual([
      {
        title: 'Blind Levels',
        description: '20-minute levels throughout.',
      },
    ]);
    expect(result.prizes).toEqual([
      {
        title: 'Champion',
        description: '$5,000 cash',
      },
      {
        title: 'Runner-up',
        description: '$2,500 cash',
      },
    ]);
  });
});
