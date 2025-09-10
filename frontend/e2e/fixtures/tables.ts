import type { Page } from '@playwright/test';
import { createHmac } from 'node:crypto';
import type { CreateTableRequest, Table } from '@shared/types';

const JWT_SECRET = 'dev-secret';

function createAdminToken(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', role: 'admin' }),
  ).toString('base64url');
  const data = `${header}.${payload}`;
  const signature = createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

const ADMIN_TOKEN = createAdminToken();

const defaultTable: CreateTableRequest = {
  tableName: 'Test Table',
  gameType: 'texas',
  stakes: { small: 1, big: 2 },
  startingStack: 100,
  players: { max: 6 },
  buyIn: { min: 40, max: 200 },
};

const createdIds: string[] = [];

export async function seedTable(
  page: Page,
  table: CreateTableRequest = defaultTable,
): Promise<Table> {
  const res = await page.request.post(
    'http://localhost:4000/api/admin/tables',
    {
      data: table,
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    },
  );
  const json = (await res.json()) as Table;
  createdIds.push(json.id);
  return json;
}

export async function cleanupTables(page: Page): Promise<void> {
  for (const id of createdIds) {
    await page.request.delete(`http://localhost:4000/api/admin/tables/${id}`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
  }
  createdIds.length = 0;
}
