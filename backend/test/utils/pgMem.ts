import { DataSource, EntityTarget } from 'typeorm';
import { IMemoryDb, newDb } from 'pg-mem';

/**
 * Registers a deterministic UUID v4 generator for pg-mem.
 *
 * pg-mem does not provide uuid_generate_v4 out of the box. This helper
 * installs a simple implementation so TypeORM entities using UUID columns can
 * operate without hitting "function does not exist" errors.
 */
export function registerUuid(db: IMemoryDb): void {
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
}

export async function createInMemoryDataSource(
  entities: EntityTarget<any>[],
): Promise<DataSource> {
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
  registerUuid(db);
  const dataSource = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities,
    synchronize: true,
  }) as DataSource;
  await dataSource.initialize();
  return dataSource;
}

// Backwards compatibility
export { createInMemoryDataSource as createDataSource };
export default createInMemoryDataSource;
