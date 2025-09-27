import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { logInfrastructureNotice } from './common/logging';
import { cookieSecurity } from './common/cookie-security.middleware';
import { LegacyRouteConverter } from '@nestjs/core/router/legacy-route-converter';

const originalLegacyPrintWarning = (
  LegacyRouteConverter as unknown as {
    printWarning: (route: string) => void;
  }
).printWarning.bind(LegacyRouteConverter);

(LegacyRouteConverter as unknown as {
  printWarning: (route: string) => void;
}).printWarning = (route: string) => {
  logInfrastructureNotice(
    `Unsupported route path "${route}" encountered; attempting to auto-convert legacy wildcard syntax.`,
  );
  if ((process.env.NODE_ENV ?? 'development') === 'production') {
    originalLegacyPrintWarning(route);
  }
};

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
    logInfrastructureNotice('ELASTIC_URL is not set; Elasticsearch logging disabled', {
      logger,
    });
  }
  if (!config.get<string>('logging.lokiUrl')) {
    logInfrastructureNotice('LOKI_URL is not set; Loki logging disabled', {
      logger,
    });
  }

  app.use(cookieParser());
  app.use(cookieSecurity);
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
