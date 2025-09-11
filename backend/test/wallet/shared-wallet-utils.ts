import type { WalletService } from '../../src/wallet/wallet.service';
import type { EventPublisher } from '../../src/events/events.service';

// Utility helpers shared between deposit and withdraw specs
export async function expectRateLimitExceeded(
  service: WalletService,
  operation: 'deposit' | 'withdraw',
  accountId: string,
): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await (service as any)[operation](accountId, 100, 'd1', '2.2.2.2', 'USD');
  }
  await expect(
    (service as any)[operation](accountId, 100, 'd1', '2.2.2.2', 'USD'),
  ).rejects.toThrow('Rate limit exceeded');
}

export async function expectDailyLimitExceeded(
  service: WalletService,
  operation: 'deposit' | 'withdraw',
  accountId: string,
  events: EventPublisher,
  redis: { keys(pattern: string): Promise<string[]>; get(key: string): Promise<string | null>; },
): Promise<void> {
  const envVar =
    operation === 'deposit'
      ? 'WALLET_DAILY_DEPOSIT_LIMIT'
      : 'WALLET_DAILY_WITHDRAW_LIMIT';
  process.env[envVar] = '200';

  await (service as any)[operation](accountId, 150, 'd1', '4.4.4.4', 'USD');
  (events.emit as jest.Mock).mockClear();
  await expect(
    (service as any)[operation](accountId, 60, 'd2', '4.4.4.4', 'USD'),
  ).rejects.toThrow('Daily limit exceeded');

  // eslint-disable-next-line @typescript-eslint/unbound-method
  expect(events.emit as jest.Mock).toHaveBeenCalledWith(
    'antiCheat.flag',
    expect.objectContaining({
      accountId,
      operation,
      currency: 'USD',
    }),
  );

  const [key] = await redis.keys(`wallet:${operation}*`);
  expect(parseInt((await redis.get(key)) ?? '0', 10)).toBe(150);
  delete process.env[envVar];
}
