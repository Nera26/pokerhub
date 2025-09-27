import { registerAs } from '@nestjs/config';

import { resolveDatabaseUrl } from './database-url';

export default registerAs('database', () => {
  return {
    url: resolveDatabaseUrl(),
    synchronize: process.env.DB_SYNC === 'true',
  };
});
