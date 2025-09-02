import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';

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

export const testDataSource = db.adapters.createTypeormDataSource({
  type: 'postgres',
  entities: [],
  synchronize: true,
}) as DataSource;

export default testDataSource;
