import { TournamentService } from '../src/tournament/tournament.service';

describe('TournamentService.getFilterOptions', () => {
  function createService(filterRepo: { find: jest.Mock }): TournamentService {
    return new TournamentService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      filterRepo as any,
      undefined,
      undefined,
    );
  }

  it('returns available filter options from the repository', async () => {
    const filterRepo = {
      find: jest.fn().mockResolvedValue([
        { label: 'Active', value: 'active' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Past', value: 'past' },
      ]),
    };
    const service = createService(filterRepo as any);

    const result = await service.getFilterOptions();

    expect(filterRepo.find).toHaveBeenCalledWith({ order: { value: 'ASC' } });
    expect(result).toEqual([
      { label: 'Active', value: 'active' },
      { label: 'Upcoming', value: 'upcoming' },
      { label: 'Past', value: 'past' },
    ]);
  });

  it('returns an empty array when no options are present', async () => {
    const filterRepo = { find: jest.fn().mockResolvedValue([]) };
    const service = createService(filterRepo as any);

    const result = await service.getFilterOptions();

    expect(result).toEqual([]);
  });

  it('throws when repository returns invalid options', async () => {
    const filterRepo = {
      find: jest.fn().mockResolvedValue([
        { label: 'Everything', value: 'all' },
      ]),
    };
    const service = createService(filterRepo as any);

    await expect(service.getFilterOptions()).rejects.toThrow();
  });
});
