import { randomUUID } from 'node:crypto';
import { IMemoryDb, newDb } from 'pg-mem';
import { DataSource, EntityTarget } from 'typeorm';

export interface PgMemOptions {
  entities?: EntityTarget<any>[];
  synchronize?: boolean;
}

export function registerPgMemExtensions(
  db: IMemoryDb,
  opts: { deterministicUuid?: boolean } = {},
): void {
  const { deterministicUuid = true } = opts;

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

  if (deterministicUuid) {
    let seq = 1;
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => {
        const id = seq.toString(16).padStart(32, '0');
        seq += 1;
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
      },
    });
  } else {
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => randomUUID(),
    });
  }
}

export async function createPgMemDataSource({
  entities = [],
  synchronize = true,
}: PgMemOptions = {}): Promise<DataSource> {
  const db = newDb();
  registerPgMemExtensions(db);
  const dataSource = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities,
    synchronize,
  }) as DataSource;
  await dataSource.initialize();
  return dataSource;
}

export async function destroyPgMemDataSource(
  dataSource?: DataSource | null,
): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}

export async function createInMemoryDataSource(
  entitiesOrOptions: EntityTarget<any>[] | PgMemOptions = [],
): Promise<DataSource> {
  if (Array.isArray(entitiesOrOptions)) {
    return createPgMemDataSource({ entities: entitiesOrOptions });
  }

  return createPgMemDataSource(entitiesOrOptions);
}

export { destroyPgMemDataSource as destroyInMemoryDataSource };
