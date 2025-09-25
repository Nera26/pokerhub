import { createPgMemDataSource } from './pgMemFactory';

export const testDataSource = await createPgMemDataSource({});

export default testDataSource;
