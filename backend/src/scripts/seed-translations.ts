import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { TranslationEntity } from '../database/entities/translation.entity';
import { LanguageSchema } from '@shared/types';

const TranslationSchema = LanguageSchema.extend({
  messages: z.record(z.string()),
});

type Translation = z.infer<typeof TranslationSchema>;

async function loadTranslations(): Promise<Translation[]> {
  const serviceUrl = process.env.I18N_SERVICE_URL;
  if (serviceUrl) {
    const res = await fetch(serviceUrl);
    if (!res.ok) {
      throw new Error(`Failed to load translations: ${res.status}`);
    }
    const data = await res.json();
    return z.array(TranslationSchema).parse(data);
  }

  const dir = path.join(__dirname, 'translations');
  const files = await fs.readdir(dir);
  const translations: Translation[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(dir, file), 'utf8');
    translations.push(TranslationSchema.parse(JSON.parse(raw)));
  }
  return translations;
}

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(TranslationEntity);
  const translations = await loadTranslations();
  for (const { code, messages } of translations) {
    for (const [key, value] of Object.entries(messages)) {
      await repo.upsert({ lang: code, key, value }, ['lang', 'key']);
    }
  }
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
