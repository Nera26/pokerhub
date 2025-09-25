import { createHmac } from 'node:crypto';
import type { APIRequestContext, Page } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4000';
const DEFAULT_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'password123';
const JWT_SECRETS = process.env.JWT_SECRETS?.split(',');
const DEFAULT_JWT_SECRET = JWT_SECRETS?.[0] ?? 'dev-secret';

export interface AdminCredentials {
  email: string;
  password: string;
}

const defaultCredentials: AdminCredentials = {
  email: DEFAULT_ADMIN_EMAIL,
  password: DEFAULT_ADMIN_PASSWORD,
};

function createAdminToken(secret: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', role: 'admin' }),
  ).toString('base64url');
  const data = `${header}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

let cachedAdminToken: string | null = null;

export function adminToken(): string {
  if (!cachedAdminToken) {
    cachedAdminToken = createAdminToken(DEFAULT_JWT_SECRET);
  }
  return cachedAdminToken;
}

async function registerAdminUser(
  request: APIRequestContext,
  credentials: AdminCredentials,
): Promise<void> {
  const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
    data: { email: credentials.email, password: credentials.password },
  });

  if (response.ok()) {
    return;
  }

  if (response.status() === 409) {
    // User already exists, nothing to do.
    return;
  }

  const body = await response.text();
  throw new Error(
    `Failed to register admin user (${response.status()}): ${body || 'unknown error'}`,
  );
}

async function seedAdminDashboardUser(
  request: APIRequestContext,
  credentials: AdminCredentials,
): Promise<void> {
  const response = await request.post(`${API_BASE_URL}/api/admin/users`, {
    data: { username: credentials.email },
    headers: { Authorization: `Bearer ${adminToken()}` },
  });

  if (response.ok()) {
    return;
  }

  if (response.status() === 409) {
    // Already present.
    return;
  }

  const body = await response.text();
  throw new Error(
    `Failed to seed admin dashboard user (${response.status()}): ${body || 'unknown error'}`,
  );
}

export async function ensureAdminUser(
  request: APIRequestContext,
  credentials: AdminCredentials = defaultCredentials,
): Promise<void> {
  await registerAdminUser(request, credentials);
  await seedAdminDashboardUser(request, credentials);
}

export async function loginAsAdmin(
  page: Page,
  credentials: AdminCredentials = defaultCredentials,
): Promise<void> {
  await ensureAdminUser(page.request, credentials);

  await page.goto('/login');
  await page.fill('#login-email', credentials.email);
  await page.fill('#login-password', credentials.password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}
