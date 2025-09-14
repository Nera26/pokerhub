import { http, HttpResponse, delay } from 'msw';

type Options = { status?: number; once?: boolean; statusText?: string };

export function mockSuccess(
  data: unknown,
  { status = 200, once = false, statusText }: Options = {},
) {
  return http.all('*', () => HttpResponse.json(data, { status, statusText }), {
    once,
  });
}

export function mockError(
  data: unknown = { error: 'fail' },
  { status = 500, once = false, statusText }: Options = {},
) {
  return http.all('*', () => HttpResponse.json(data, { status, statusText }), {
    once,
  });
}

export function mockLoading({ once = false }: { once?: boolean } = {}) {
  return http.all(
    '*',
    async () => {
      await delay('infinite');
      return HttpResponse.text('');
    },
    { once },
  );
}

export function getTablesSuccess(
  data: unknown,
  { status = 200, once = false, statusText }: Options = {},
) {
  return http.get(
    '/api/tables',
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function getTablesError(
  data: unknown = { error: 'fail' },
  { status = 500, once = false, statusText }: Options = {},
) {
  return http.get(
    '/api/tables',
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function getTournamentsSuccess(
  data: unknown,
  { status = 200, once = false, statusText }: Options = {},
) {
  return http.get(
    '/api/tournaments',
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function getTournamentsError(
  data: unknown = { error: 'fail' },
  { status = 500, once = false, statusText }: Options = {},
) {
  return http.get(
    '/api/tournaments',
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function postRegisterTournamentSuccess(
  id: string,
  data: unknown = { message: 'ok' },
  { status = 200, once = false, statusText }: Options = {},
) {
  return http.post(
    `/api/tournaments/${id}/register`,
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function postRegisterTournamentError(
  id: string,
  data: unknown = { error: 'fail' },
  { status = 500, once = false, statusText }: Options = {},
) {
  return http.post(
    `/api/tournaments/${id}/register`,
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function postWithdrawTournamentSuccess(
  id: string,
  data: unknown = { message: 'ok' },
  { status = 200, once = false, statusText }: Options = {},
) {
  return http.post(
    `/api/tournaments/${id}/withdraw`,
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}

export function postWithdrawTournamentError(
  id: string,
  data: unknown = { error: 'fail' },
  { status = 500, once = false, statusText }: Options = {},
) {
  return http.post(
    `/api/tournaments/${id}/withdraw`,
    () => HttpResponse.json(data, { status, statusText }),
    { once },
  );
}
