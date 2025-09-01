import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { WalletService } from './wallet/wallet.service';
import { scheduleReconcileJob } from './wallet/reconcile.job';
import { EventPublisher } from './events/events.service';
import {
  setupTelemetry,
  shutdownTelemetry,
  telemetryMiddleware,
} from './telemetry/telemetry';

async function bootstrap() {
  setupTelemetry();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(cookieParser());
  app.use(telemetryMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  scheduleReconcileJob(
    app.get(WalletService),
    app.get(Logger),
    app.get(EventPublisher),
  );

  const shutdown = async () => {
    await app.close();
    await shutdownTelemetry();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
void bootstrap();
