/** @jest-environment node */

import { z } from 'zod';
import { handleResponse, ResponseLike } from '@/lib/api/client';

describe('handleResponse', () => {
  it('throws ApiError when JSON parsing fails', async () => {
    const res: ResponseLike = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('invalid');
      },
    };

    await expect(
      handleResponse(Promise.resolve(res), z.object({})),
    ).rejects.toEqual({
      message: 'Invalid server response',
    });
  });

  it('throws ApiError on schema validation failure', async () => {
    const res: ResponseLike = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ token: 123 }),
    };
    const schema = z.object({ token: z.string() });

    await expect(handleResponse(Promise.resolve(res), schema)).rejects.toEqual({
      message: 'Invalid server response',
    });
  });

  it('includes status and details when response is not ok', async () => {
    const res: ResponseLike = {
      status: 500,
      statusText: 'Server Error',
      ok: false,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'bad' }),
    };

    await expect(handleResponse(res, z.object({}))).rejects.toEqual({
      status: 500,
      message: 'Server Error',
      details: '{"error":"bad"}',
    });
  });

  it('includes message and errors from JSON error response', async () => {
    const body = {
      message: 'Bad input',
      errors: { foo: 'bar' },
    };
    const res = new Response(JSON.stringify(body), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(handleResponse(res, z.object({}))).rejects.toEqual({
      status: 400,
      message: 'Bad input',
      errors: { foo: 'bar' },
      details: JSON.stringify(body),
    });
  });

  it('throws ApiError for non-JSON response', async () => {
    const res: ResponseLike = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: { get: () => 'text/html' },
      text: async () => '<html></html>',
    };

    await expect(
      handleResponse(Promise.resolve(res), z.object({})),
    ).rejects.toEqual({
      message: 'Invalid server response',
    });
  });

  it('throws ApiError on network error', async () => {
    await expect(
      handleResponse(Promise.reject(new Error('fail')), z.object({})),
    ).rejects.toEqual({ message: 'fail' });
  });

  it('throws ApiError when response lacks json method', async () => {
    const res: ResponseLike = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: { get: () => 'application/json' },
    };

    await expect(handleResponse(res, z.object({}))).rejects.toEqual({
      message: 'Invalid server response',
    });
  });

  it('throws ApiError when response lacks text method', async () => {
    const res: ResponseLike = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: { get: () => 'text/plain' },
    };

    await expect(handleResponse(res, z.object({}))).rejects.toEqual({
      message: 'Invalid server response',
    });
  });
});
