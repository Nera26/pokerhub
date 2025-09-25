export {
  registerPgMemExtensions,
  createInMemoryDataSource,
  createPgMemDataSource,
  destroyPgMemDataSource,
  destroyPgMemDataSource as destroyInMemoryDataSource,
  destroyPgMemDataSource as destroyDataSource,
} from './pgMemFactory';

export { createInMemoryDataSource as createDataSource } from './pgMemFactory';
export { createInMemoryDataSource as default } from './pgMemFactory';
