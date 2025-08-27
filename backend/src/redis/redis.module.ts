import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisStoreWrapper = redisStore as unknown as (
          options: any,
        ) => Promise<CacheStore>;
        const url = config.get<string>('redis.url');
        const { hostname, port } = new URL(url);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const store = await redisStoreWrapper({
          host: hostname,
          port: Number(port),
        });
        return { store };
      },
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url');
        return new Redis(url);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', CacheModule],
})
export class RedisModule {}
