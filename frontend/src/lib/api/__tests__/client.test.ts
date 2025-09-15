import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/app/store/authStore';
import { setupFetch } from './setupFetch';

describe('api client auth headers', () => {
  afterEach(() => {
    useAuthStore.setState({ token: null, avatarUrl: null });
  });

  it('attaches Authorization header and merges custom headers for JSON bodies', async () => {
    useAuthStore.setState({ token: 'test-token', avatarUrl: null });

    const fetchSetup = setupFetch({ ok: true });

    await apiClient('/test', z.object({ ok: z.boolean() }), {
      method: 'POST',
      body: { foo: 'bar' },
      headers: { 'X-Custom': 'yes' },
    });

    expect(fetchSetup.mock).toHaveBeenCalledTimes(1);
    const init = fetchSetup.init;
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      'X-Custom': 'yes',
      'content-type': 'application/json',
    });
    expect(init.body).toBe(JSON.stringify({ foo: 'bar' }));
  });

  it('attaches Authorization header and merges custom headers for FormData bodies', async () => {
    useAuthStore.setState({ token: 'test-token', avatarUrl: null });

    const form = new FormData();
    form.append('foo', 'bar');

    const fetchSetup = setupFetch({ ok: true });

    await apiClient('/test', z.object({ ok: z.boolean() }), {
      method: 'POST',
      body: form,
      headers: { 'X-Custom': 'yes' },
    });

    expect(fetchSetup.mock).toHaveBeenCalledTimes(1);
    const init = fetchSetup.init;
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      'X-Custom': 'yes',
    });
    expect(
      (init.headers as Record<string, string>)['content-type'],
    ).toBeUndefined();
    expect(init.body).toBe(form);
  });
});
