import { test, expect } from './fixtures';
import {
  createTestTable,
  cleanupTables,
  defaultTable,
} from './fixtures/tables';

test.afterEach(async ({ page }) => {
  await cleanupTables(page);
});

test('table list displays seeded table', async ({ page }) => {
  await createTestTable(page);
  const tablesResponse = page.waitForResponse('**/api/tables');
  await page.goto('/table');
  await tablesResponse;
  await expect(page.getByText(defaultTable.tableName)).toBeVisible();
});
