import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { HistoryService } from '../../src/history/history.service';
import type { HistoryRepository } from '../../src/history/history.repository';
import type {
  GameHistory,
  TournamentBracket,
  TournamentHistory,
  WalletHistory,
} from '../../src/history/history.entity';

describe('HistoryService.getTournamentBracket', () => {
  let service: HistoryService;
  let bracketRepo: { findOne: jest.Mock };

  beforeEach(() => {
    bracketRepo = { findOne: jest.fn() };
    service = new HistoryService(
      { find: jest.fn().mockResolvedValue([]) } as unknown as HistoryRepository<GameHistory>,
      {
        find: jest.fn().mockResolvedValue([]),
      } as unknown as HistoryRepository<TournamentHistory>,
      { find: jest.fn().mockResolvedValue([]) } as unknown as HistoryRepository<WalletHistory>,
      bracketRepo as unknown as HistoryRepository<TournamentBracket>,
    );
  });

  it('returns the parsed bracket when the user owns it', async () => {
    bracketRepo.findOne.mockResolvedValue({
      tournamentId: 't1',
      userId: '00000000-0000-0000-0000-000000000001',
      rounds: [
        {
          name: 'Quarter Finals',
          matches: [
            { id: 'm1', players: ['A', 'B'], winner: 'A' },
          ],
        },
      ],
    });

    await expect(
      service.getTournamentBracket(
        't1',
        '00000000-0000-0000-0000-000000000001',
      ),
    ).resolves.toEqual({
      tournamentId: 't1',
      rounds: [
        {
          name: 'Quarter Finals',
          matches: [
            { id: 'm1', players: ['A', 'B'], winner: 'A' },
          ],
        },
      ],
    });
  });

  it('allows admin access regardless of owner', async () => {
    bracketRepo.findOne.mockResolvedValue({
      tournamentId: 't1',
      userId: '00000000-0000-0000-0000-000000000001',
      rounds: [],
    });

    await expect(service.getTournamentBracket('t1', 'admin')).resolves.toEqual({
      tournamentId: 't1',
      rounds: [],
    });
  });

  it('throws when the bracket is missing', async () => {
    bracketRepo.findOne.mockResolvedValue(undefined);

    await expect(service.getTournamentBracket('missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when the user does not own the bracket', async () => {
    bracketRepo.findOne.mockResolvedValue({
      tournamentId: 't1',
      userId: '00000000-0000-0000-0000-000000000001',
      rounds: [],
    });

    await expect(service.getTournamentBracket('t1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
