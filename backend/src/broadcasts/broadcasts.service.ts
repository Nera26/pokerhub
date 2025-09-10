import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BroadcastEntity } from '../database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../database/entities/broadcast-template.entity';
import { Broadcast, SendBroadcastRequest } from '../schemas/broadcasts';

@Injectable()
export class BroadcastsService {
  private readonly repo: Repository<BroadcastEntity>;
  private readonly templatesRepo: Repository<BroadcastTemplateEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BroadcastEntity);
    this.templatesRepo = dataSource.getRepository(BroadcastTemplateEntity);
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

  async listTemplates(): Promise<Record<string, string>> {
    const entities = await this.templatesRepo.find();
    return entities.reduce((acc, e) => {
      acc[e.name] = e.text;
      return acc;
    }, {} as Record<string, string>);
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
