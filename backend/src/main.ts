import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './logging/logger';
import { setupTelemetry, shutdownTelemetry } from './telemetry';

async function bootstrap() {
  setupTelemetry();
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useLogger({
    log: (msg: unknown) => logger.info(msg),
    error: (msg: unknown) => logger.error(msg),
    warn: (msg: unknown) => logger.warn(msg),
    debug: (msg: unknown) => logger.debug(msg),
    verbose: (msg: unknown) => logger.trace(msg),
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  process.on('SIGTERM', async () => {
    await app.close();
    await shutdownTelemetry();
  });
}
bootstrap();
