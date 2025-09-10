import { test, expect } from './fixtures';
import { seedTable, cleanupTables } from './fixtures/tables';

test.afterEach(async ({ page }) => {
  await cleanupTables(page);
});

test('table list displays seeded table', async ({ page }) => {
  const table = await seedTable(page);
  const tablesResponse = page.waitForResponse('**/api/tables');
  await page.goto('/table');
  await tablesResponse;
  await expect(page.getByText(table.tableName)).toBeVisible();
});
