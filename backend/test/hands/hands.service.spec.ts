import { HandsService } from '../../src/hands/hands.service';
import { HandProofEntity } from '../../src/hands/hand-proof.entity';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';

describe('HandsService', () => {
  let dataSource: DataSource;
  let service: HandsService;

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
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [HandProofEntity],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const repo = dataSource.getRepository(HandProofEntity);
    service = new HandsService(repo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('stores and retrieves proof', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    await service.recordCommitment(id, 'c');
    await service.recordReveal(id, { seed: 's', nonce: 'n', commitment: 'c' }, []);
    const proof = await service.getProof(id);
    expect(proof).toEqual({ seed: 's', nonce: 'n', commitment: 'c' });
  });
});
