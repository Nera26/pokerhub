import { render, screen, within } from '@testing-library/react';
import FilterDropdown from '../FilterDropdown';
import { useGameTypes } from '@/hooks/useGameTypes';

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: jest.fn(),
}));

const mockUseGameTypes = useGameTypes as jest.MockedFunction<
  typeof useGameTypes
>;

describe('FilterDropdown', () => {
  const baseProps = {
    open: true,
    filters: { gameType: 'any', profitLoss: 'any', date: '' },
    onApply: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    mockUseGameTypes.mockReset();
  });

  it('renders game type options from hook', () => {
    mockUseGameTypes.mockReturnValue({
      data: [
        { id: 'texas', label: "Texas Hold'em" },
        { id: 'omaha', label: 'Omaha' },
      ],
      isLoading: false,
      error: null,
    });
    render(<FilterDropdown {...baseProps} />);
    const select = screen.getAllByRole('combobox')[0];
    expect(
      within(select).getByRole('option', { name: "Texas Hold'em" }),
    ).toBeInTheDocument();
    expect(
      within(select).getByRole('option', { name: 'Omaha' }),
    ).toBeInTheDocument();
  });

  it('disables select while loading', () => {
    mockUseGameTypes.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });
    render(<FilterDropdown {...baseProps} />);
    const select = screen.getAllByRole('combobox')[0];
    expect(select).toBeDisabled();
  });

  it('renders only default option when empty', () => {
    mockUseGameTypes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<FilterDropdown {...baseProps} />);
    const select = screen.getAllByRole('combobox')[0];
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Any');
  });

  it('shows error message when fetching fails', () => {
    mockUseGameTypes.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
    render(<FilterDropdown {...baseProps} />);
    expect(screen.getByText(/failed to load game types/i)).toBeInTheDocument();
  });
});
