import { Logger } from 'nestjs-pino';
import { WalletService } from './wallet/wallet.service';
import { scheduleReconcileJob } from './wallet/reconcile.job';
import { EventPublisher } from './events/events.service';
import { shutdownTelemetry } from './telemetry/telemetry';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { bootstrap } from './bootstrap';

async function main() {
  const app = await bootstrap();

  const config = new DocumentBuilder()
    .setTitle('PokerHub API')
    .setVersion('2.5.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

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
void main();
