import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Broadcast from '../Broadcast';
import { fetchBroadcasts, sendBroadcast } from '@/lib/api/broadcasts';

jest.mock('@/lib/api/broadcasts', () => ({
  fetchBroadcasts: jest.fn(),
  sendBroadcast: jest.fn(),
}));

describe('Broadcast', () => {
  function renderWithClient(ui) {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  beforeEach(() => {
    (fetchBroadcasts as jest.Mock).mockResolvedValue({ broadcasts: [] });
    (sendBroadcast as jest.Mock).mockRejectedValue(new Error('fail'));
  });

  it('shows toast after successful broadcast', async () => {
    renderWithClient(<Broadcast />);
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(/enter your broadcast message/i),
      'Hello there',
    );
    await user.click(
      screen.getByRole('button', { name: /send broadcast/i }),
    );

    expect(
      await screen.findByText(/failed to send broadcast/i),
    ).toBeInTheDocument();
  });
});
