const useActivityMock = jest.fn(() => ({
  data: { labels: [], data: [] },
  isLoading: false,
  error: null,
}));

jest.mock('@/hooks/useActivity', () => ({
  useActivity: (...args: any[]) => useActivityMock(...args),
}));

export function mockUseActivity() {
  return useActivityMock;
}
