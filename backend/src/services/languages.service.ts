import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Language } from '@shared/types';
import { LanguageEntity } from '../database/entities/language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly repo: Repository<LanguageEntity>,
  ) {}

  async findAll(): Promise<Language[]> {
    return this.repo.find();
  }
}
