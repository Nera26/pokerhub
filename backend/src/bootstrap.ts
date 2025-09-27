import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { logBootstrapNotice } from './common/logging.utils';

interface BootstrapOptions {
  telemetry?: boolean;
}

export async function bootstrap(options: BootstrapOptions = {}) {
  const { telemetry = true } = options;
  let telemetryExports: any;
  if (telemetry) {
    telemetryExports = await import('./telemetry/telemetry.js');
    await telemetryExports.setupTelemetry();
  }
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  if (telemetry) {
    app.get(Logger).log('Telemetry initialized');
  }

  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  if (!config.get<string>('logging.elasticUrl')) {
    logBootstrapNotice(logger, 'ELASTIC_URL is not set; Elasticsearch logging disabled');
  }
  if (!config.get<string>('logging.lokiUrl')) {
    logBootstrapNotice(logger, 'LOKI_URL is not set; Loki logging disabled');
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
