import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import type { CacheManagerStore } from 'cache-manager';

const REDIS_MOCK_FLAG = Symbol.for('pokerhub.redisMock');
const logger = new Logger('RedisModule');

function createRedisMock(): Redis {
  const mock = new (RedisMock as typeof Redis)();
  (mock as any)[REDIS_MOCK_FLAG] = true;
  if ((mock as any).options) {
    delete (mock as any).options.host;
    delete (mock as any).options.port;
    (mock as any).options.path = ':memory:';
  }
  process.env.REDIS_IN_MEMORY = '1';
  return mock;
}

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<CacheModuleOptions> => {
        const url = config.get<string>('redis.url');
        if (!url) {
          if ((process.env.NODE_ENV ?? 'development') === 'production') {
            throw new Error('Missing redis.url configuration');
          }
          logger.warn(
            'REDIS_URL is not configured; falling back to in-memory cache store for local development.',
          );
          process.env.REDIS_IN_MEMORY = '1';
          return {};
        }

        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'unknown error';
          throw new Error(`Invalid redis.url configuration: ${reason}`);
        }

        const port = parsed.port ? Number(parsed.port) : 6379;

        if (typeof redisStore !== 'function') {
          logger.warn(
            'cache-manager-ioredis redisStore export is unavailable; falling back to in-memory cache store.',
          );
          return {};
        }

        // Probe connectivity first to avoid slow boot / hanging store creation
        const probe = new Redis(url, {
          lazyConnect: true,
          connectTimeout: 500,
          retryStrategy: () => null,
        });

        try {
          await probe.connect();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn(
            `Redis cache probe failed (${message}); falling back to in-memory cache store.`,
          );
          try {
            await probe.disconnect();
          } catch (disconnectError) {
            const disconnectMessage =
              disconnectError instanceof Error
                ? disconnectError.message
                : String(disconnectError);
            logger.error(`Failed to clean up Redis cache probe: ${disconnectMessage}`);
          }
          return {};
        }

        try {
          const store = (await redisStore({
            host: parsed.hostname,
            port,
          })) as CacheManagerStore;
          return { store } satisfies CacheModuleOptions;
        } finally {
          try {
            await probe.disconnect();
          } catch (disconnectError) {
            const disconnectMessage =
              disconnectError instanceof Error
                ? disconnectError.message
                : String(disconnectError);
            logger.error(`Failed to clean up Redis cache probe: ${disconnectMessage}`);
          }
        }
      },
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (config: ConfigService) => {
        const url = config.get<string>('redis.url');
        if (!url) {
          if ((process.env.NODE_ENV ?? 'development') === 'production') {
            throw new Error('Missing redis.url configuration');
          }
          logger.warn(
            'REDIS_URL is not configured; using in-memory Redis mock for local development.',
          );
          return createRedisMock();
        }

        const client = new Redis(url, {
          lazyConnect: true,
          connectTimeout: 500,
          retryStrategy: () => null,
        });

        try {
          await client.connect();
          process.env.REDIS_IN_MEMORY = '0';

          client.on('error', (err) => {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(
              `Redis connection failed (${message}); continuing with best-effort in-memory fallbacks.`,
            );
          });

          return client;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn(
            `Redis connection failed (${message}); using in-memory Redis mock for local development.`,
          );
          try {
            await client.disconnect();
          } catch (disconnectError) {
            const disconnectMessage =
              disconnectError instanceof Error
                ? disconnectError.message
                : String(disconnectError);
            logger.error(`Failed to clean up Redis connection: ${disconnectMessage}`);
          }
          return createRedisMock();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', CacheModule],
})
export class RedisModule {}
