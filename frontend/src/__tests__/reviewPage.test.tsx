import { render, screen, fireEvent } from '@testing-library/react';
import ReviewPage from '@/features/review';
import { listFlaggedSessions, applyReviewAction } from '@/lib/api/review';

jest.mock('@/lib/api/review', () => ({
  listFlaggedSessions: jest.fn(),
  applyReviewAction: jest.fn(),
}));

describe('ReviewPage', () => {
  it('renders sessions and triggers next action', async () => {
    (listFlaggedSessions as jest.Mock).mockResolvedValue([
      { id: 's1', users: ['u1', 'u2'], status: 'flagged' },
    ]);
    render(<ReviewPage />);
    expect(await screen.findByText('s1')).toBeInTheDocument();
    (applyReviewAction as jest.Mock).mockResolvedValue({ message: 'warn' });
    const btn = await screen.findByText('warn');
    fireEvent.click(btn);
    expect(applyReviewAction).toHaveBeenCalledWith('s1', 'warn');
  });
});
