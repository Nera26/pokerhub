import { randomUUID } from 'crypto';
import { WalletService } from '../../src/wallet/wallet.service';

export async function confirmChallenge(
  service: WalletService,
  challenge: { id: string },
  status: 'approved' | 'chargeback',
): Promise<void> {
  await service.confirm3DS({
    eventId: randomUUID(),
    idempotencyKey: randomUUID(),
    providerTxnId: challenge.id,
    status,
  });
}
