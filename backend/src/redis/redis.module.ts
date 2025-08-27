import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-ioredis';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisStoreWrapper = redisStore as unknown as (
          options: any,
        ) => Promise<CacheStore>;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const store = await redisStoreWrapper({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        });
        return { store };
      },
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        }),
    },
  ],
  exports: ['REDIS_CLIENT', CacheModule],
})
export class RedisModule {}
