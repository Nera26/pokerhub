import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

interface BootstrapOptions {
  telemetry?: boolean;
}

export async function bootstrap(options: BootstrapOptions = {}) {
  const { telemetry = true } = options;
  let telemetryExports: any;
  if (telemetry) {
    telemetryExports = await import('./telemetry/telemetry');
    await telemetryExports.setupTelemetry();
  }
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  if (telemetry) {
    app.get(Logger).log('Telemetry initialized');
  }

  app.use(cookieParser());
  if (telemetry && telemetryExports) {
    app.use(telemetryExports.telemetryMiddleware);
  }

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

  return app;
}
