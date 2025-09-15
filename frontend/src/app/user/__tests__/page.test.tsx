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

jest.mock('../../components/user/ProfileSection', () => () => (
  <div>Profile</div>
));
jest.mock('../../components/user/GameStatistics', () => () => <div>Stats</div>);
jest.mock('../../components/user/HistoryTabs', () => () => <div>Tabs</div>);
jest.mock('../../components/user/EditProfileModal', () => () => null);
jest.mock('../../components/user/LogoutModal', () => () => null);

jest.mock('../../components/user/HistoryList', () => (props: any) => (
  <button onClick={() => props.onViewBracket?.('Summer Series')}>
    View Bracket
  </button>
));

jest.mock('../../components/user/FilterDropdown', () => () => null);

jest.mock(
  '../../components/user/BracketModal',
  () =>
    ({ isOpen, title, onClose }: any) =>
      isOpen ? (
        <div role="dialog">
          <h3>{title} Bracket</h3>
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
