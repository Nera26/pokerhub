import { createHmac, timingSafeEqual } from 'crypto';

export function verifySignature(
  payload: string,
  signature: string,
  secret = process.env.PROVIDER_WEBHOOK_SECRET ?? '',
): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
