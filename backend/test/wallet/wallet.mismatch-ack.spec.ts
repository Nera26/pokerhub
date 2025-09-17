import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { WalletService, type ReconcileRow } from '../../src/wallet/wallet.service';
import type { EventPublisher } from '../../src/events/events.service';

describe('WalletService mismatch acknowledgement', () => {
  let service: WalletService;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  const redis = { incr: jest.fn(), expire: jest.fn() } as unknown as Redis;

  beforeEach(() => {
    service = new WalletService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      events,
      redis,
      {} as any,
      {} as any,
      {} as any,
      new ConfigService(),
    );
    (events.emit as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('emits a resolution event and hides acknowledged mismatches', async () => {
    const now = new Date('2024-03-01T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    const acknowledgement = await service.acknowledgeMismatch(
      'player:1',
      'admin-1',
    );

    expect(acknowledgement).toEqual({
      account: 'player:1',
      acknowledgedBy: 'admin-1',
      acknowledgedAt: now.toISOString(),
    });
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.reconcile.mismatch.resolved',
      acknowledgement,
    );

    const remaining = service.filterAcknowledgedMismatches([
      { account: 'player:1', balance: 1500, journal: 1200 } satisfies ReconcileRow,
      { account: 'reserve', balance: 0, journal: 0 } satisfies ReconcileRow,
    ]);
    expect(remaining).toEqual([
      { account: 'reserve', balance: 0, journal: 0 },
    ]);
  });

  it('drops acknowledgements once the mismatch disappears', async () => {
    await service.acknowledgeMismatch('player:1', 'admin-1');

    const afterAck = service.filterAcknowledgedMismatches([
      { account: 'player:1', balance: 1500, journal: 1200 } satisfies ReconcileRow,
    ]);
    expect(afterAck).toEqual([]);

    const resolved = service.filterAcknowledgedMismatches([
      { account: 'reserve', balance: 50, journal: 0 } satisfies ReconcileRow,
    ]);
    expect(resolved).toEqual([
      { account: 'reserve', balance: 50, journal: 0 },
    ]);

    const reintroduced = service.filterAcknowledgedMismatches([
      { account: 'player:1', balance: 1500, journal: 1200 } satisfies ReconcileRow,
    ]);
    expect(reintroduced).toEqual([
      { account: 'player:1', balance: 1500, journal: 1200 },
    ]);
  });
});
