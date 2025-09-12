jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: () => ({
    data: [
      { id: 'texas', label: 'Texas' },
      { id: 'tournaments', label: 'Tournaments' },
    ],
    error: null,
    isLoading: false,
  }),
}));

jest.mock('@/app/components/common/chat/ChatWidget', () => ({
  __esModule: true,
  default: () => null,
}));

export function mockHomeDependencies() {
  // no-op: importing this module applies the mocks
}
