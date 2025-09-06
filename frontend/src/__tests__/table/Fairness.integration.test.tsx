import { render, screen, fireEvent, act } from '@testing-library/react';
import { EventEmitter } from 'events';
import TablePageClient from '@/app/table/[id]/TablePageClient';
import { useTableData } from '@/hooks/useTableData';
import useGameSocket from '@/hooks/useGameSocket';
import { EVENT_SCHEMA_VERSION } from '@shared/events';

jest.mock('@/hooks/useTableData');
jest.mock('@/hooks/useApiError', () => ({ useApiError: () => null }));
jest.mock('@/hooks/useGameSocket');
jest.mock('next/dynamic', () => {
  const dynamic = () => {
    const DynamicComponent = () => null;
    DynamicComponent.displayName = 'DynamicMock';
    return DynamicComponent;
  };
  return dynamic;
});
jest.mock('@/components/FairnessModal', () => ({
  __esModule: true,
  default: ({ isOpen, handId }: { isOpen: boolean; handId: string }) =>
    isOpen ? <div data-testid="fairness-modal">Proof {handId}</div> : null,
}));

const mockUseTableData = useTableData as jest.MockedFunction<typeof useTableData>;
const mockUseGameSocket = useGameSocket as jest.MockedFunction<typeof useGameSocket>;

describe('TablePageClient fairness features', () => {
  function setup() {
    const socket = new EventEmitter();
    mockUseTableData.mockReturnValue({
      data: {
        smallBlind: 1,
        bigBlind: 2,
        pot: 0,
        communityCards: [],
        players: [{ id: 'p1', username: 'Alice', avatar: '', chips: 100 }],
        chatMessages: [],
        stateAvailable: true,
      },
      error: null,
      isLoading: false,
    } as any);
    mockUseGameSocket.mockReturnValue({ socket } as any);
    return socket;
  }

  it('renders proof download link when hand ends', async () => {
    const socket = setup();
    render(<TablePageClient tableId="t1" />);

    act(() => {
      socket.emit('hand.end', { handId: 'h123', version: EVENT_SCHEMA_VERSION });
    });

    const link = await screen.findByRole('link', { name: /download proof/i });
    expect(link).toHaveAttribute('href', '/api/hands/h123/proof');
    expect(link).toHaveAttribute('download', 'hand-h123-proof.json');
  });

  it('opens fairness modal on verify hand click', async () => {
    const socket = setup();
    render(<TablePageClient tableId="t1" />);

    act(() => {
      socket.emit('hand.end', { handId: 'h123', version: EVENT_SCHEMA_VERSION });
    });

    const button = await screen.findByRole('button', { name: /verify hand/i });
    fireEvent.click(button);
    expect(await screen.findByTestId('fairness-modal')).toBeInTheDocument();
  });
});
