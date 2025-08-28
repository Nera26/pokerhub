import * as bcrypt from 'bcrypt';
import { writeFileSync } from 'fs';

async function seed() {
  const password = 'secret';
  const hash = await bcrypt.hash(password, 10);
  const record = {
    email: 'user@example.com',
    password: hash,
  };
  writeFileSync('test-credentials.json', JSON.stringify(record, null, 2));
  console.log('Seeded credentials to test-credentials.json');
}

seed();
