/** @jest-environment node */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import jestOpenAPI from 'jest-openapi';
import spec from './openapi.json';
import { GET as getTournaments } from '@/app/api/tournaments/route';
import { GET as getTables } from '@/app/api/tables/route';

const server = setupServer(
  http.get('http://localhost:3000/api/tournaments', async () => {
    const res = await getTournaments();
    const data = await res.json();
    return HttpResponse.json(data, { status: res.status });
  }),
  http.get('http://localhost:3000/api/tables', async () => {
    const res = await getTables();
    const data = await res.json();
    return HttpResponse.json(data, { status: res.status });
  }),
);

beforeAll(() => {
  server.listen();
  jestOpenAPI(spec as any);
});

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API contract', () => {
  it('tournaments endpoint conforms to OpenAPI spec', async () => {
    const res = await fetch('http://localhost:3000/api/tournaments');
    const body = await res.json();
    const wrapped = {
      status: res.status,
      body,
      req: { method: 'GET', path: '/api/tournaments' },
    } as const;
    expect(res.status).toBe(200);
    await expect(wrapped).toSatisfyApiSpec();
  });

  it('tables endpoint conforms to OpenAPI spec', async () => {
    const res = await fetch('http://localhost:3000/api/tables');
    const body = await res.json();
    const wrapped = {
      status: res.status,
      body,
      req: { method: 'GET', path: '/api/tables' },
    } as const;
    expect(res.status).toBe(200);
    await expect(wrapped).toSatisfyApiSpec();
  });
});
