import { http, HttpResponse } from 'msw';
import { server } from '@/test-utils/server';

export function setupDashboardMocks() {
  server.use(
    // Dashboard metrics
    http.get('/api/dashboard/metrics', () =>
      HttpResponse.json({
        online: 0,
        revenue: 0,
        activity: [],
        errors: [],
      }),
    ),
    // Revenue breakdown
    http.get('/api/admin/revenue-breakdown', () => HttpResponse.json([])),
    // Recent dashboard users
    http.get('/api/admin/users', () => HttpResponse.json([])),
    // Active tables
    http.get('/api/tables', () => HttpResponse.json([])),
    // Activity chart data
    http.get('/api/analytics/activity', () =>
      HttpResponse.json({ labels: [], data: [] }),
    ),
  );
}
