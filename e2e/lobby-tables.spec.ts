import { test, expect } from './fixtures';
import { TablesResponseSchema } from '@shared/types';

test('tables API matches shared schema', async ({ page }) => {
  const tablesResponse = page.waitForResponse(
    (res) => res.url().includes('/api/tables') && res.request().method() === 'GET',
  );
  await page.goto('/');
  const res = await tablesResponse;
  const json = await res.json();
  expect(() => TablesResponseSchema.parse(json)).not.toThrow();
});
