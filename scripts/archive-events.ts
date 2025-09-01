/// <reference path="./parquetjs-lite.d.ts" />
import fs from 'fs';
import path from 'path';
import { ParquetSchema, ParquetWriter } from 'parquetjs-lite';

export async function archiveEvents(
  sourceDir = path.resolve(__dirname, '../storage/events'),
  archiveDir = path.resolve(__dirname, '../storage/events/archive')
): Promise<void> {
  if (!fs.existsSync(sourceDir)) return;
  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.jsonl'));
  if (files.length === 0) return;
  await fs.promises.mkdir(archiveDir, { recursive: true });
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = content
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    if (rows.length === 0) continue;
    const schema = buildSchema(rows[0]);
    const parquetPath = path.join(
      archiveDir,
      file.replace(/\.jsonl$/, '.parquet')
    );
    const writer = await ParquetWriter.openFile(schema, parquetPath);
    for (const row of rows) {
      await writer.appendRow(row);
    }
    await writer.close();
    fs.unlinkSync(filePath);
  }
}

function buildSchema(record: Record<string, any>): any {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'number') {
      fields[key] = {
        type: Number.isInteger(value) ? 'INT64' : 'DOUBLE',
      };
    } else if (typeof value === 'boolean') {
      fields[key] = { type: 'BOOLEAN' };
    } else {
      fields[key] = { type: 'UTF8' };
    }
  }
  return new ParquetSchema(fields);
}

if (require.main === module) {
  archiveEvents().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
