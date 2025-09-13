import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultAvatarEntity } from '../database/entities/default-avatar.entity';

@Injectable()
export class DefaultAvatarService {
  constructor(
    @InjectRepository(DefaultAvatarEntity)
    private readonly repo: Repository<DefaultAvatarEntity>,
  ) {}

  async get(): Promise<string> {
    const entity = await this.repo.findOne({ where: {} });
    return entity?.url ?? '';
  }

  async update(url: string): Promise<string> {
    let entity = await this.repo.findOne({ where: {} });
    if (!entity) {
      entity = this.repo.create({ url });
    } else {
      entity.url = url;
    }
    await this.repo.save(entity);
    return entity.url;
  }
}
