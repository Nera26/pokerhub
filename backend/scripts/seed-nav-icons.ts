#!/usr/bin/env ts-node
import { AppDataSource } from '../src/database/data-source';
import { NavIconEntity } from '../src/database/entities/nav-icon.entity';
import { NavIconsService } from '../src/services/nav-icons.service';

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(NavIconEntity);
  const service = new NavIconsService(repo);
  await service.seed();
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
