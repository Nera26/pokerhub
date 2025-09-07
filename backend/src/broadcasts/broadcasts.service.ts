import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BroadcastEntity } from '../database/entities/broadcast.entity';
import { Broadcast, SendBroadcastRequest } from '../schemas/broadcasts';

@Injectable()
export class BroadcastsService {
  private readonly repo: Repository<BroadcastEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BroadcastEntity);
  }

  async list(): Promise<Broadcast[]> {
    const entities = await this.repo.find({ order: { timestamp: 'DESC' } });
    return entities.map((e) => ({
      id: e.id,
      type: e.type as Broadcast['type'],
      text: e.text,
      timestamp: e.timestamp.toISOString(),
      urgent: e.urgent,
    }));
  }

  async send(req: SendBroadcastRequest): Promise<Broadcast> {
    const entity = this.repo.create({
      type: req.type,
      text: req.text,
      urgent: req.urgent,
    });
    const saved = await this.repo.save(entity);
    return {
      id: saved.id,
      type: saved.type as Broadcast['type'],
      text: saved.text,
      timestamp: saved.timestamp.toISOString(),
      urgent: saved.urgent,
    };
  }
}
