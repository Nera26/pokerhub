import { render, screen, fireEvent } from '@testing-library/react';
import CollusionReviewPage from '@/features/collusion';
import { listFlaggedSessions, applyAction } from '@/lib/api/collusion';

jest.mock('@/lib/api/collusion', () => ({
  listFlaggedSessions: jest.fn(),
  applyAction: jest.fn(),
}));

describe('CollusionReviewPage', () => {
  it('renders sessions and triggers next action', async () => {
    (listFlaggedSessions as jest.Mock).mockResolvedValue([
      { id: 's1', users: ['u1', 'u2'], status: 'flagged' },
    ]);
    render(<CollusionReviewPage />);
    expect(await screen.findByText('s1')).toBeInTheDocument();
    (applyAction as jest.Mock).mockResolvedValue({ message: 'warn' });
    const btn = await screen.findByText('warn');
    fireEvent.click(btn);
    expect(applyAction).toHaveBeenCalledWith('s1', 'warn');
  });
});
