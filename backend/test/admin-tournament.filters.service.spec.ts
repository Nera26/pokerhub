import { TournamentService } from '../src/tournament/tournament.service';
import { DEFAULT_ADMIN_TOURNAMENT_FILTERS } from '../src/tournament/admin-tournament-filter.defaults';

function createService(
  adminFilterRepo?: { find: jest.Mock },
): TournamentService {
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
    {} as any,
    {} as any,
    undefined,
    undefined,
    undefined,
    adminFilterRepo as any,
  );
}

describe('TournamentService.getAdminFilterOptions', () => {
  it('returns filters sourced from the repository', async () => {
    const adminFilterRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'primary', label: 'Primary', colorClass: 'border-primary', sortOrder: 1 },
        { id: 'secondary', label: 'Secondary', colorClass: null, sortOrder: 2 },
      ]),
    };

    const service = createService(adminFilterRepo as any);

    await expect(service.getAdminFilterOptions()).resolves.toEqual([
      { id: 'primary', label: 'Primary', colorClass: 'border-primary' },
      { id: 'secondary', label: 'Secondary' },
    ]);

    expect(adminFilterRepo.find).toHaveBeenCalledWith({ order: { sortOrder: 'ASC' } });
  });

  it('falls back to defaults when the repository is empty', async () => {
    const adminFilterRepo = { find: jest.fn().mockResolvedValue([]) };
    const service = createService(adminFilterRepo as any);

    await expect(service.getAdminFilterOptions()).resolves.toEqual(
      DEFAULT_ADMIN_TOURNAMENT_FILTERS,
    );
  });

  it('falls back to defaults when the repository is unavailable', async () => {
    const service = createService();

    await expect(service.getAdminFilterOptions()).resolves.toEqual(
      DEFAULT_ADMIN_TOURNAMENT_FILTERS,
    );
  });
});
