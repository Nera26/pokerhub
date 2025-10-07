import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('@/components/user/profile-section', () => () => (
  <div>Profile</div>
));
jest.mock('@/components/user/game-statistics', () => () => <div>Stats</div>);
jest.mock('@/components/user/history-tabs', () => () => <div>Tabs</div>);
jest.mock('@/components/user/edit-profile-modal', () => () => null);
jest.mock('@/components/user/logout-modal', () => () => null);

jest.mock('@/components/user/history-list', () => (props: any) => (
  <button
    onClick={() =>
      props.onViewBracket?.({ id: 'tournament-1', title: 'Summer Series' })
    }
  >
    View Bracket
  </button>
));

jest.mock('@/components/user/filter-dropdown', () => () => null);

jest.mock(
  '@/components/user/bracket-modal',
  () =>
    ({ isOpen, tournament, onClose }: any) =>
      isOpen ? (
        <div role="dialog">
          <h3>{tournament?.title} Bracket</h3>
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
);

describe('UserPage bracket modal', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockImplementation(() => ({ data: {} }));
    mockUseMutation.mockReturnValue({ mutate: jest.fn() });
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it('opens bracket modal when View Bracket is clicked', async () => {
    const { default: UserPage } = await import('../page');
    render(<UserPage />);
    const button = screen.getByRole('button', { name: /view bracket/i });
    await userEvent.click(button);
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Summer Series Bracket',
    );
  });
});
