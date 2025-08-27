import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticLogProducer {
  private client: Client | null;

  constructor(private readonly config: ConfigService) {
    const node = this.config.get<string>('logging.elasticUrl');
    this.client = node ? new Client({ node }) : null;
  }

  async log(index: string, document: Record<string, any>) {
    if (!this.client) return;
    await this.client.index({ index, document });
  }
}
