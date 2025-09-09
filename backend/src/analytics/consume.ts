import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EtlService } from './etl.service';

export async function consume(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const etl = app.get(EtlService);
    await etl.run();
  } finally {
    await app.close();
  }
}

