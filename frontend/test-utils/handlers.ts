import { http, HttpResponse } from 'msw';

export const getTablesSuccess = (tables: unknown = []) =>
  http.get('/api/tables', () => HttpResponse.json(tables, { status: 200 }));

export const getTablesError = (
  error: unknown = { error: 'Failed to fetch tables' },
  status = 500,
) => http.get('/api/tables', () => HttpResponse.json(error, { status }));

export const getTournamentsSuccess = (tournaments: unknown = []) =>
  http.get('/api/tournaments', () =>
    HttpResponse.json(tournaments, { status: 200 }),
  );

export const getTournamentsError = (
  error: unknown = { error: 'Failed to fetch tournaments' },
  status = 500,
) => http.get('/api/tournaments', () => HttpResponse.json(error, { status }));

export const createTableSuccess = (table: unknown) =>
  http.post('/api/tables', () => HttpResponse.json(table, { status: 201 }));

export const createTableError = (
  error: unknown = { error: 'Failed to create table' },
  status = 500,
) => http.post('/api/tables', () => HttpResponse.json(error, { status }));
