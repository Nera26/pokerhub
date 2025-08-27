import { test, expect } from './fixtures';

test('user can log in', async ({ page }) => {
  // Mock the login API response to simulate a successful authentication
  await page.route('**/api/auth/login', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'fake-token' }),
    });
  });

  await page.goto('/login');

  // Ensure the branding renders
  await expect(page.getByAltText('PokerHub logo')).toBeVisible();

  // Fill the login form and submit
  await page.fill('#login-email', 'user@example.com');
  await page.fill('#login-password', 'password123');
  await page.getByRole('button', { name: /login/i }).click();

  // A successful login redirects to the home page
  await expect(page).toHaveURL('/');
});
