import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LokiLogProducer {
  private url?: string;
  private timeout: number;
  private retries: number;
  private readonly logger = new Logger(LokiLogProducer.name);

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('logging.lokiUrl');
    this.timeout = this.config.get<number>('logging.lokiTimeout', 5000);
    this.retries = this.config.get<number>('logging.lokiRetries', 0);
  }

  async log(stream: Record<string, string>, message: string) {
    if (!this.url) return;
    const body = {
      streams: [
        {
          stream,
          values: [[(Date.now() * 1e6).toString(), message]],
        },
      ],
    };
    const payload = JSON.stringify(body);

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        await fetch(`${this.url}/loki/api/v1/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timer);
        break;
      } catch (error) {
        clearTimeout(timer);
        if (attempt === this.retries) {
          this.logger.error('Failed to push log to Loki', error as Error);
          throw error;
        }
      }
    }
  }
}
