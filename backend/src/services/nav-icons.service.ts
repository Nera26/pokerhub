import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NavIcon } from '@shared/types';
import { NavIconEntity } from '../database/entities/nav-icon.entity';
import { SimpleListService } from './simple-list.service';

@Injectable()
export class NavIconsService extends SimpleListService<NavIconEntity> {
  constructor(
    @InjectRepository(NavIconEntity) repo: Repository<NavIconEntity>,
  ) {
    super(repo);
  }

  async list(): Promise<NavIcon[]> {
    return this.find();
  }
}
