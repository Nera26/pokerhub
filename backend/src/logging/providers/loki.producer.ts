import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LokiLogProducer {
  private url?: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('logging.lokiUrl');
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
    await fetch(`${this.url}/loki/api/v1/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}
