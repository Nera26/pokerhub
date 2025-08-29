import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { SettlementJournal } from './settlement-journal.entity';
import { SettlementService } from './settlement.service';
import type { Street } from '../game/state-machine';

describe('SettlementService', () => {
  let module: TestingModule;
  let service: SettlementService;
  let repo: Repository<SettlementJournal>;

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => '00000000-0000-0000-0000-000000000000',
    });
    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [SettlementJournal],
      synchronize: true,
    }) as DataSource;

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => dataSource.options,
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([SettlementJournal]),
      ],
      providers: [SettlementService],
    }).compile();

    service = module.get(SettlementService);
    repo = module.get(getRepositoryToken(SettlementJournal));
  });

  afterAll(async () => {
    await module.close();
  });

  const handId = 'hand';
  const street: Street = 'flop';
  const idx = 1;

  it('reserve ignores duplicates', async () => {
    await service.reserve(handId, street, idx);
    await service.reserve(handId, street, idx);
    const rows = await repo.find();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('reserved');
  });

  it('commit transitions reserved to committed', async () => {
    await repo.clear();
    await service.reserve(handId, street, idx);
    await service.commit(handId, street, idx);
    const entry = await repo.findOneByOrFail({ idempotencyKey: `${handId}#${street}#${idx}` });
    expect(entry.status).toBe('committed');
  });

  it('commit is idempotent', async () => {
    await repo.clear();
    await service.reserve(handId, street, idx);
    await service.commit(handId, street, idx);
    let entry = await repo.findOneByOrFail({ idempotencyKey: `${handId}#${street}#${idx}` });
    const firstUpdated = entry.updatedAt.getTime();
    await service.commit(handId, street, idx);
    entry = await repo.findOneByOrFail({ idempotencyKey: `${handId}#${street}#${idx}` });
    expect(entry.status).toBe('committed');
    expect(entry.updatedAt.getTime()).toBe(firstUpdated);
  });
});
