import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupTelemetry, shutdownTelemetry } from './telemetry/telemetry';

async function bootstrap() {
  setupTelemetry();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(cookieParser());
  app.use((req, res, next) => {
    const original = res.cookie.bind(res);
    res.cookie = (name: string, value: any, options: any = {}) =>
      original(name, value, {
        sameSite: 'strict',
        httpOnly: true,
        secure: true,
        ...options,
      });
    next();
  });

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

  const shutdown = async () => {
    await app.close();
    await shutdownTelemetry();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
void bootstrap();
