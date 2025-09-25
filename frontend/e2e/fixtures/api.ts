import type { APIRequestContext } from '@playwright/test';

type EnsureUserOptions = {
  email: string;
  password: string;
  role?: 'Admin' | 'Player';
};

export async function ensureUser(
  request: APIRequestContext,
  { email, password, role }: EnsureUserOptions,
): Promise<void> {
  const response = await request.post('http://127.0.0.1:4000/api/test/users', {
    data: { email, password, role },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to ensure user: ${response.status()} ${body}`);
  }
}

export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const response = await request.post('http://127.0.0.1:4000/api/auth/login', {
    data: { email, password },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed: ${response.status()} ${body}`);
  }
  const json = (await response.json()) as { token: string };
  return json.token;
}

type SeedCollusionOptions = {
  sessionId?: string;
  users?: string[];
  features?: Record<string, unknown>;
};

export async function seedCollusionSession(
  request: APIRequestContext,
  options: SeedCollusionOptions = {},
): Promise<{ id: string; users: string[] }> {
  const response = await request.post(
    'http://127.0.0.1:4000/api/test/collusion/flag',
    {
      data: options,
    },
  );
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to seed collusion: ${response.status()} ${body}`);
  }
  return (await response.json()) as { id: string; users: string[] };
}

export async function clearCollusionSession(
  request: APIRequestContext,
  sessionId: string,
): Promise<void> {
  const response = await request.delete(
    `http://127.0.0.1:4000/api/test/collusion/${sessionId}`,
  );
  if (!response.ok() && response.status() !== 404) {
    const body = await response.text();
    throw new Error(`Failed to delete collusion session: ${body}`);
  }
}
