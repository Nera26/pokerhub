import { test, expect } from './fixtures';
import { TablesResponseSchema } from '@shared/types';
import { createTestTable, cleanupTables } from './fixtures/tables';

test.afterEach(async ({ page }) => {
  await cleanupTables(page);
});

test('tables API matches shared schema', async ({ page }) => {
  await createTestTable(page);
  const tablesResponse = page.waitForResponse(
    (res) =>
      res.url().includes('/api/tables') && res.request().method() === 'GET',
  );
  await page.goto('/');
  const res = await tablesResponse;
  const json = await res.json();
  expect(() => TablesResponseSchema.parse(json)).not.toThrow();
});
