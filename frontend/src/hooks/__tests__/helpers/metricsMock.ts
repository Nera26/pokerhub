export function mockDashboardMetrics(
  data: unknown = {
    online: 5,
    revenue: 1234,
    activity: [1, 2],
    errors: [3, 4],
  },
) {
  return jest.fn<Promise<Response>, []>().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
  } as unknown as Response);
}
