import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis';
import Redis from 'ioredis';
import type { CacheStore } from 'cache-manager';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<CacheModuleOptions> => {
        const redisStoreWrapper = redisStore as unknown as (
          options: any,
        ) => Promise<CacheStore>;
        const url = config.get<string>('redis.url');
        if (!url) {
          throw new Error('Missing redis.url configuration');
        }
        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'unknown error';
          throw new Error(`Invalid redis.url configuration: ${reason}`);
        }
        const port = parsed.port ? Number(parsed.port) : 6379;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const store = await redisStoreWrapper({
          host: parsed.hostname,
          port,
        });
        const options: CacheModuleOptions = { store };
        return options;
      },
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url');
        if (!url) {
          throw new Error('Missing redis.url configuration');
        }
        return new Redis(url);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', CacheModule],
})
export class RedisModule {}
