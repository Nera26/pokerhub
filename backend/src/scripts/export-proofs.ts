import 'dotenv/config';
import { AppDataSource } from '../database/data-source';
import { Hand } from '../database/entities/hand.entity';

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Hand);
  const hands = await repo.find();
  for (const h of hands) {
    console.log(
      JSON.stringify({
        id: h.id,
        seed: h.seed,
        nonce: h.nonce,
        commitment: h.commitment,
      }),
    );
  }
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
