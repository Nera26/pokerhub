import { screen, fireEvent } from '@testing-library/react';
import { renderHomePageClient } from './utils/homeClient';
import { registerTournament } from '@/lib/api/lobby';

jest.mock('@/lib/api/lobby');
jest.mock('@/hooks/useApiError', () => ({
  useApiError: () => 'failed to register',
}));

var ChatWidgetMock: jest.Mock;
jest.mock('@/app/components/common/chat/ChatWidget', () => {
  ChatWidgetMock = jest.fn(() => <div data-testid="chat-widget" />);
  return { __esModule: true, default: ChatWidgetMock };
});

function MockTournamentList({
  onRegister,
}: {
  onRegister: (id: string) => void;
}) {
  return <button onClick={() => onRegister('1')}>Register</button>;
}

function MockCashGameList() {
  return <div data-testid="tables-list" />;
}

type Scenario = {
  name: string;
  setup: () => void;
  verify: () => void | Promise<void>;
};

const scenarios: Scenario[] = [
  {
    name: 'loading uses HomeLoadingSkeleton',
    setup: () => {
      renderHomePageClient({
        tables: { data: undefined, error: null, isLoading: true },
      });
    },
    verify: () => {
      expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
      expect(document.getElementById('cash-games-section')).toBeInTheDocument();
    },
  },
  {
    name: 'shows toast on failed registration',
    setup: () => {
      (registerTournament as jest.Mock).mockRejectedValueOnce(
        new Error('boom'),
      );
      renderHomePageClient({
        cashGameList: MockCashGameList,
        tournamentList: MockTournamentList,
      });
    },
    verify: async () => {
      fireEvent.click(screen.getByText('Register'));
      const messages = await screen.findAllByText('failed to register');
      expect(messages.length).toBeGreaterThan(0);
    },
  },
  {
    name: 'renders chat widget immediately',
    setup: () => {
      renderHomePageClient({
        cashGameList: () => <div />,
        tournamentList: () => <div />,
      });
    },
    verify: () => {
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
      expect(ChatWidgetMock).toHaveBeenCalled();
      expect(ChatWidgetMock.mock.calls[0][0]).toEqual({});
    },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomePageClient', () => {
  it.each(scenarios)('$name', async ({ setup, verify }) => {
    setup();
    await verify();
  });
});
