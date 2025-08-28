import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EventConsumer } from './event-consumer';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const consumer = app.get(EventConsumer);
  await consumer.run();
}

void bootstrap();
