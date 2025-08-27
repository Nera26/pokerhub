import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { HandProofEntity } from '../hands/hand-proof.entity';
import { config } from 'dotenv';

config();

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [HandProofEntity],
  });
  await dataSource.initialize();
  const proofs = await dataSource.getRepository(HandProofEntity).find();
  console.log(JSON.stringify(proofs, null, 2));
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
