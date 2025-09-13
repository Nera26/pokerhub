import { test } from '@playwright/test';
import { bringUp, tearDown } from './utils/smoke';
import { loginAndPlay } from './utils/loginAndPlay';

test.describe('table smoke', () => {
  test.beforeAll(async () => {
    await bringUp();
  });

  test.afterAll(() => {
    tearDown();
  });

  test('join table and play a hand', async ({ page }) => {
    await loginAndPlay(page);
  });
});
