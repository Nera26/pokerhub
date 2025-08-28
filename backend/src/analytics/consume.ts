import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EtlService } from './etl.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const etl = app.get(EtlService);
  await etl.run();
}

void bootstrap();
