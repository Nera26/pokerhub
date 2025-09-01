/// <reference path="../parquetjs-lite.d.ts" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ParquetReader } from 'parquetjs-lite';
import { archiveEvents } from '../archive-events.ts';

test('converts JSONL to Parquet with expected schema', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'events-'));
  const source = path.join(tmp, 'storage/events');
  const archive = path.join(tmp, 'storage/events/archive');
  fs.mkdirSync(source, { recursive: true });
  const jsonl = path.join(source, 'sample.jsonl');
  fs.writeFileSync(jsonl, '{"id":1,"name":"a"}\n{"id":2,"name":"b"}\n');
  await archiveEvents(source, archive);
  const parquetPath = path.join(archive, 'sample.parquet');
  assert.ok(fs.existsSync(parquetPath));
  const reader = await ParquetReader.openFile(parquetPath);
  const cursor = reader.getCursor();
  const rows: any[] = [];
  let row;
  while ((row = await cursor.next())) {
    rows.push({ id: Number(row.id), name: row.name });
  }
  await reader.close();
  assert.deepEqual(rows, [
    { id: 1, name: 'a' },
    { id: 2, name: 'b' },
  ]);
});
