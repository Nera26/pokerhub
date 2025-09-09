import { test, expect } from './fixtures';
import { mockTablesRoute, tables } from './fixtures/tables';

test('table list displays mocked table', async ({ page }) => {
  await mockTablesRoute(page);

  await page.goto('/table');
  await expect(page.getByText(tables[0].tableName)).toBeVisible();
});
