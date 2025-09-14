/** @jest-environment node */

import { fetchTables } from '@/lib/api/table';
import { fetchTournamentDetails, createCTA, updateCTA } from '@/lib/api/lobby';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();
const fetchSpy = jest.fn((input: RequestInfo, init?: RequestInit) =>
  server.fetch(input, init),
);

beforeAll(() => {
  server.listen();
  // @ts-expect-error override for tests
  global.fetch = fetchSpy;
});

afterEach(() => {
  server.resetHandlers();
  fetchSpy.mockReset();
});

afterAll(() => {
  server.close();
});
import { tables, tournamentDetails } from '../fixtures/lobby';

describe('lobby api', () => {
  it('fetches tables', async () => {
    server.use(
      http.get('http://localhost:3000/api/tables', () =>
        HttpResponse.json(tables),
      ),
    );

    await expect(fetchTables()).resolves.toEqual(tables);
  });

  it('throws ApiError on failure', async () => {
    server.use(
      http.get('http://localhost:3000/api/tables', () =>
        HttpResponse.text('fail', { status: 500, statusText: 'Server Error' }),
      ),
    );

    await expect(fetchTables()).rejects.toEqual({
      status: 500,
      message: 'Server Error',
      details: 'fail',
    });
  });

  it('fetches tournament details', async () => {
    server.use(
      http.get('http://localhost:3000/api/tournaments/t1', () =>
        HttpResponse.json(tournamentDetails),
      ),
    );

    await expect(fetchTournamentDetails('t1')).resolves.toEqual(
      tournamentDetails,
    );
  });

  it('throws ApiError when tournament details request fails', async () => {
    server.use(
      http.get('http://localhost:3000/api/tournaments/x', () =>
        HttpResponse.text('missing', { status: 404, statusText: 'Not Found' }),
      ),
    );

    await expect(fetchTournamentDetails('x')).rejects.toEqual({
      status: 404,
      message: 'Not Found',
      details: 'missing',
    });
  });

  it('creates CTA via POST', async () => {
    const cta = {
      id: 'c1',
      label: 'Join',
      href: '/join',
      variant: 'primary',
    };
    server.use(
      http.post('http://localhost:3000/api/ctas', () => HttpResponse.json(cta)),
    );

    await expect(createCTA(cta)).rejects.toBeDefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3000/api/ctas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(cta),
      }),
    );
  });

  it('updates CTA via PUT', async () => {
    const cta = {
      id: 'c1',
      label: 'Join',
      href: '/join',
      variant: 'primary',
    };
    server.use(
      http.put('http://localhost:3000/api/ctas/c1', () =>
        HttpResponse.json(cta),
      ),
    );

    await expect(updateCTA('c1', cta)).rejects.toBeDefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3000/api/ctas/c1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(cta),
      }),
    );
  });
});
