import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Broadcast from '@/app/components/dashboard/Broadcast';
import { sendBroadcast } from '@/lib/api/broadcasts';

jest.mock('@/lib/api/broadcasts', () => ({
  fetchBroadcasts: jest.fn(() => Promise.resolve({ broadcasts: [] })),
  fetchBroadcastTemplates: jest.fn(() => Promise.resolve({ templates: {} })),
  sendBroadcast: jest.fn(() => Promise.resolve()),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

it('shows error toast on failure', async () => {
  (sendBroadcast as jest.Mock).mockRejectedValueOnce(new Error('fail'));
  renderWithClient(<Broadcast />);
  const user = userEvent.setup();
  const input = screen.getByPlaceholderText(/enter your broadcast message here/i);
  fireEvent.change(input, { target: { value: 'hello world' } });
  await user.click(screen.getByRole('button', { name: /send broadcast/i }));
  expect(await screen.findByText(/failed to send broadcast/i)).toBeInTheDocument();
});
