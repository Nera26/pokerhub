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

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 3,
    timeoutMs = 5_000,
    backoffMs = 100,
  ): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res;
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;
        if (attempt === retries) break;
        const delay = backoffMs * 2 ** (attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    const message =
      lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Request to ${url} failed after ${retries} attempts: ${message}`);
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
    const res = await this.fetchWithRetry(
      `${this.baseUrl}/payment_intents`,
      {
        method: 'POST',
        headers: this.authHeaders(),
        body,
      },
    );
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }

  async getStatus(id: string): Promise<ProviderStatus> {
    const res = await this.fetchWithRetry(
      `${this.baseUrl}/payment_intents/${id}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      },
    );
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
