import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { dump } from 'js-yaml';

async function generate() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('PokerHub API')
    .setVersion('2.5.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const yaml = dump(document);
  const outputPath = resolve(__dirname, '../../contracts/openapi.generated.yaml');
  writeFileSync(outputPath, yaml);
  await app.close();
}

void generate();
