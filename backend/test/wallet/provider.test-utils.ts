import type { Request } from 'express';
import { signProviderPayload } from './test-utils';

export function makeProviderRequest(body: unknown, signature?: string): Request {
  return {
    headers: {
      'x-provider-signature': signature ?? signProviderPayload(body),
      'x-event-id': 'evt1',
    },
  } as Request;
}

export const paymentIntentSucceeded = (id: string) => ({
  id: 'evt1',
  type: 'payment_intent.succeeded',
  data: { object: { id, status: 'succeeded' } },
});
