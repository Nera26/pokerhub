import { render, screen, waitFor } from '@testing-library/react';
import SpectatorTable from '@/features/table/spectator';

jest.mock('@/lib/spectator-socket', () => ({
  subscribeToTable: jest.fn((_tableId: string, handler: (state: any) => void) => {
    handler({
      players: [
        { id: 'p1', stack: 100, holeCards: ['AS', 'KD'], secret: 'private' },
      ],
      communityCards: [],
    });
    return jest.fn();
  }),
  disconnectSpectatorSocket: jest.fn(),
}));

describe('SpectatorTable privacy', () => {
  it('does not render hole cards or private metadata', async () => {
    render(<SpectatorTable tableId="t1" />);

    await waitFor(() => {
      expect(screen.getByText('p1: 100')).toBeInTheDocument();
    });

    expect(screen.queryByText('AS')).toBeNull();
    expect(screen.queryByText('KD')).toBeNull();
    expect(screen.queryByText('private')).toBeNull();
  });
});
