import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { z } from 'zod';

import { TableListSchema, type TableList, type TableListQuery } from '@shared/types';

function buildQueryString(query?: TableListQuery): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  if (query.status) {
    params.set('status', query.status);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

type ListTablesOptions<T> = {
  path?: string;
  schema?: z.ZodType<T>;
};

export async function listTables<T = TableList>(
  app: INestApplication,
  query?: TableListQuery,
  options: ListTablesOptions<T> = {},
): Promise<T> {
  const { path = '/tables', schema } = options;
  const queryString = buildQueryString(query);
  const res = await request(app.getHttpServer())
    .get(`${path}${queryString}`)
    .expect(200);

  const parser = (schema ?? TableListSchema) as z.ZodType<T>;
  return parser.parse(res.body);
}
