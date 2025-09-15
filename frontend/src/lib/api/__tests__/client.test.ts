import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/app/store/authStore';

describe('api client auth headers', () => {
  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockReset();
    useAuthStore.setState({ token: null, avatarUrl: null });
  });

  it('attaches Authorization header and merges custom headers for JSON bodies', async () => {
    useAuthStore.setState({ token: 'test-token', avatarUrl: null });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as any;

    await apiClient('/test', z.object({ ok: z.boolean() }), {
      method: 'POST',
      body: { foo: 'bar' },
      headers: { 'X-Custom': 'yes' },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      'X-Custom': 'yes',
      'content-type': 'application/json',
    });
    expect(init.body).toBe(JSON.stringify({ foo: 'bar' }));
  });

  it('attaches Authorization header and merges custom headers for FormData bodies', async () => {
    useAuthStore.setState({ token: 'test-token', avatarUrl: null });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as any;

    const form = new FormData();
    form.append('foo', 'bar');

    await apiClient('/test', z.object({ ok: z.boolean() }), {
      method: 'POST',
      body: form,
      headers: { 'X-Custom': 'yes' },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
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
