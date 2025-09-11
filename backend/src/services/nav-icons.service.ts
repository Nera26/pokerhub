import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NavIcon } from '@shared/types';
import { NavIconEntity } from '../database/entities/nav-icon.entity';

@Injectable()
export class NavIconsService {
  constructor(
    @InjectRepository(NavIconEntity)
    private readonly repo: Repository<NavIconEntity>,
  ) {}

  async list(): Promise<NavIcon[]> {
    return this.repo.find();
  }
}
