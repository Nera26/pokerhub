import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export type ProviderStatus = 'approved' | 'risky' | 'chargeback';

export interface ProviderChallenge {
  id: string;
}

@Injectable()
export class PaymentProviderService {
  private readonly apiKey = process.env.STRIPE_API_KEY ?? '';
  private readonly baseUrl = 'https://api.stripe.com/v1';

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async initiate3DS(
    accountId: string,
    amount: number,
  ): Promise<ProviderChallenge> {
    const body = new URLSearchParams({
      amount: String(amount),
      currency: 'usd',
    });
    body.append('metadata[accountId]', accountId);
    const res = await fetch(`${this.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: this.authHeaders(),
      body,
    });
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }

  async getStatus(id: string): Promise<ProviderStatus> {
    const res = await fetch(`${this.baseUrl}/payment_intents/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const data = (await res.json()) as { status?: string };
    switch (data.status) {
      case 'succeeded':
        return 'approved';
      case 'requires_action':
        return 'risky';
      default:
        return 'chargeback';
    }
  }

  verifySignature(payload: string, signature: string): boolean {
    const secret = process.env.PROVIDER_WEBHOOK_SECRET ?? '';
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
