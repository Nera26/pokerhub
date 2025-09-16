import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardConfigEntity } from '../database/entities/leaderboard-config.entity';
import type {
  TimeFilter,
  ModeFilter,
  LeaderboardConfig as LeaderboardConfigDto,
} from '@shared/types';

@Injectable()
export class LeaderboardConfigService implements OnModuleInit {
  private ranges: TimeFilter[] = [];
  private modes: ModeFilter[] = [];

  constructor(
    @InjectRepository(LeaderboardConfigEntity)
    private readonly repo: Repository<LeaderboardConfigEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const rows = await this.repo.find();
    this.ranges = [...new Set(rows.map((r) => r.range))];
    this.modes = [...new Set(rows.map((r) => r.mode))];
  }

  getRanges(): TimeFilter[] {
    return this.ranges;
  }

  getModes(): ModeFilter[] {
    return this.modes;
  }

  async list(): Promise<LeaderboardConfigDto[]> {
    return this.repo.find();
  }

  async create(entry: LeaderboardConfigDto): Promise<void> {
    await this.repo.insert(entry);
    await this.load();
  }

  async update(
    criteria: LeaderboardConfigDto,
    entry: LeaderboardConfigDto,
  ): Promise<void> {
    await this.repo.update(criteria, entry);
    await this.load();
  }

  async remove(entry: LeaderboardConfigDto): Promise<void> {
    await this.repo.delete(entry);
    await this.load();
  }
}
