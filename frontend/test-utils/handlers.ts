import { http, HttpResponse, delay } from 'msw';

type Options = { status?: number; once?: boolean };

export function mockSuccess(
  data: unknown,
  { status = 200, once = false }: Options = {},
) {
  return http.all('*', () => HttpResponse.json(data, { status }), { once });
}

export function mockError(
  data: unknown = { error: 'fail' },
  { status = 500, once = false }: Options = {},
) {
  return http.all('*', () => HttpResponse.json(data, { status }), { once });
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
