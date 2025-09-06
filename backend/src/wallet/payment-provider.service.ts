import { Inject, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { ProviderCallback } from '../schemas/wallet';
import { metrics } from '@opentelemetry/api';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { fetchWithRetry, CircuitBreakerState } from '../common/http';

export type ProviderStatus = 'approved' | 'risky' | 'chargeback';

export interface ProviderChallenge {
  id: string;
}

@Injectable()
export class PaymentProviderService {
  private readonly apiKey = process.env.STRIPE_API_KEY ?? '';
  private readonly baseUrl = 'https://api.stripe.com/v1';

  private handlers = new Map<string, (event: ProviderCallback) => Promise<void>>();
  private retryQueue?: Queue;
  private retryWorker?: Worker;
  private draining: Promise<void> = Promise.resolve();

  private static readonly meter = metrics.getMeter('wallet');
  private static readonly retriesExhausted =
    PaymentProviderService.meter.createCounter(
      'payment_provider_retry_exhausted_total',
      {
        description:
          'Number of payment provider API calls that exhausted retries',
      },
    );

  private circuitBreaker: CircuitBreakerState = { failures: 0, openUntil: 0 };

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private redisKey(idempotencyKey: string) {
    return `provider:webhook:${idempotencyKey}`;
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  registerHandler(key: string, handler: (event: ProviderCallback) => Promise<void>): void {
    this.handlers.set(key, handler);
  }

  private async initQueue(): Promise<void> {
    if (this.retryQueue) return;
    const connection = {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    };
    this.retryQueue = new Queue('provider-webhook-retry', { connection });
    this.retryWorker = new Worker(
      'provider-webhook-retry',
      async (job) => {
        const { event, handlerKey } = job.data as {
          event: ProviderCallback;
          handlerKey: string;
        };
        const handler = this.handlers.get(handlerKey);
        if (!handler) throw new Error(`Missing handler for ${handlerKey}`);
        await handler(event);
        await this.redis.del(this.redisKey(event.idempotencyKey));
      },
      { connection },
    );
    this.retryWorker.on('failed', (job) => void job.retry());
  }

  async drainQueue(): Promise<void> {
    await this.initQueue();
    const queue = this.retryQueue!;
    const failed = await queue.getFailed();
    for (const job of failed) {
      await job.retry();
    }
    this.draining = (async () => {
      while (true) {
        const counts = await queue.getJobCounts('waiting', 'delayed', 'active');
        if (counts.waiting + counts.delayed + counts.active === 0) break;
        await new Promise((r) => setTimeout(r, 100));
      }
    })();
    await this.draining;
  }

  /**
   * Persist a webhook event by its idempotency key and execute the handler.
   * If the handler fails, the callback is queued for retry.
   */
  async handleWebhook(
    event: ProviderCallback,
    handlerKey: string,
  ): Promise<void> {
    await this.initQueue();
    await this.draining;
    const key = this.redisKey(event.idempotencyKey);
    const stored = await this.redis.set(
      key,
      JSON.stringify(event),
      'NX',
      'EX',
      60 * 60,
    );
    if (stored === null) return;
    const handler = this.handlers.get(handlerKey);
    if (!handler) throw new Error(`Missing handler for ${handlerKey}`);
    try {
      await handler(event);
      await this.redis.del(key);
    } catch {
      await this.retryQueue!.add(
        'retry',
        { event, handlerKey },
        { jobId: event.idempotencyKey },
      );
    }
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
    const res = await fetchWithRetry(
      `${this.baseUrl}/payment_intents`,
      {
        method: 'POST',
        headers: this.authHeaders(),
        body,
      },
      {
        onRetryExhausted: () =>
          PaymentProviderService.retriesExhausted.add(1),
        circuitBreaker: {
          state: this.circuitBreaker,
          threshold: 5,
          cooldownMs: 30_000,
          openMessage: 'Payment provider circuit breaker open',
        },
      },
    );
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }

  async getStatus(id: string): Promise<ProviderStatus> {
    const res = await fetchWithRetry(
      `${this.baseUrl}/payment_intents/${id}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      },
      {
        onRetryExhausted: () =>
          PaymentProviderService.retriesExhausted.add(1),
        circuitBreaker: {
          state: this.circuitBreaker,
          threshold: 5,
          cooldownMs: 30_000,
          openMessage: 'Payment provider circuit breaker open',
        },
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

  async confirm3DS(payload: unknown): Promise<void> {
    const type = (payload as { type?: string })?.type;
    if (!type || !type.startsWith('payment_intent.')) {
      throw new Error('invalid event type');
    }
    const intent = (payload as any)?.data?.object as
      | { id: string; status?: string; metadata?: { idempotencyKey?: string } }
      | undefined;
    if (!intent?.id) {
      throw new Error('invalid event payload');
    }
    const status: ProviderStatus =
      intent.status === 'succeeded'
        ? 'approved'
        : intent.status === 'requires_action'
          ? 'risky'
          : 'chargeback';
    const event: ProviderCallback = {
      eventId: (payload as { id?: string }).id ?? intent.id,
      idempotencyKey: intent.metadata?.idempotencyKey ?? intent.id,
      providerTxnId: intent.id,
      status,
    };
    await this.handleWebhook(event, '3ds');
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
