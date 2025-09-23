import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActionControls from '@/app/components/tables/ActionControls';
import SidePanel from '@/app/components/tables/SidePanel';
import PokerTableLayout from '@/app/components/tables/PokerTableLayout';
import type { Player } from '@/app/components/tables/types';

jest.mock('@/hooks/useChipDenominations', () => ({
  useChipDenominations: () => ({
    data: { denoms: [1000, 100, 25] },
    isLoading: false,
  }),
}));

jest.mock('@/hooks/useTableState', () => ({
  useTableState: () => ({
    data: {
      handId: 'hand-1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
      serverTime: Date.now(),
    },
  }),
}));

jest.mock('@/hooks/usePlayerTables', () => ({
  usePlayerTables: () => ({ data: [] }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('tables accessibility', () => {
  it('ActionControls slider has accessible label', () => {
    render(
      <ActionControls
        currentBet={0}
        callAmount={0}
        pot={0}
        effective={100}
        bigBlind={2}
        minTotal={2}
        maxTotal={100}
        sliderTotal={2}
        onSliderChange={() => {}}
        onFold={() => {}}
        onCheck={() => {}}
        onCall={() => {}}
        onRaiseTo={() => {}}
        isHeroTurn
        autoCheckFold={false}
        onToggleAutoCheckFold={() => {}}
        autoFoldAny={false}
        onToggleAutoFoldAny={() => {}}
        autoCallAny={false}
        onToggleAutoCallAny={() => {}}
      />,
    );
    expect(
      screen.getByRole('slider', { name: /bet amount/i }),
    ).toBeInTheDocument();
  });

  it('SidePanel tabs expose roles and selection', async () => {
    renderWithClient(
      <SidePanel
        isOpen
        tableId=""
        heroId=""
        chatMessages={[]}
        onSendMessage={() => {}}
        onToggleSound={() => {}}
        onSitOut={() => {}}
        onLeave={() => {}}
      />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const chatTab = screen.getByRole('tab', { name: /chat/i });
    await userEvent.click(chatTab);
    expect(chatTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'chat-panel');
  });

  it('PokerTableLayout toasts use status role', async () => {
    const players: Player[] = [
      {
        id: 1,
        username: 'You',
        chips: 100,
        committed: 0,
        avatar: 'https://example.com/avatar1.png',
        isActive: true,
      },
      {
        id: 2,
        username: 'Bob',
        chips: 100,
        committed: 10,
        avatar: 'https://example.com/avatar2.png',
      },
    ];
    renderWithClient(
      <PokerTableLayout
        tableId="1"
        smallBlind={1}
        bigBlind={2}
        players={players}
        heroId={1}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /fold/i }));
    const toast = await screen.findByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast.parentElement).toHaveAttribute('aria-live', 'polite');
  });
});
