import { DataSource, EntityTarget } from 'typeorm';
import { newDb } from 'pg-mem';

export async function createDataSource(entities: EntityTarget<any>[]): Promise<DataSource> {
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
  let seq = 1;
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: 'text',
    implementation: () => {
      const id = seq.toString(16).padStart(32, '0');
      seq++;
      return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
    },
  });
  const dataSource = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities,
    synchronize: true,
  }) as DataSource;
  await dataSource.initialize();
  return dataSource;
}

export default createDataSource;
