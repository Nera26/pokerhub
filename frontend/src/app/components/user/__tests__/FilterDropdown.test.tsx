import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterDropdown from '../FilterDropdown';
import { useGameTypes } from '@/hooks/useGameTypes';
import type { GameFilter, ProfitLossFilter } from '@/types/filters';

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: jest.fn(),
}));

const mockUseGameTypes = useGameTypes as jest.MockedFunction<
  typeof useGameTypes
>;

const createGameTypesResult = (
  overrides: Record<string, unknown>,
): ReturnType<typeof useGameTypes> =>
  overrides as unknown as ReturnType<typeof useGameTypes>;

describe('FilterDropdown', () => {
  const baseFilters: {
    gameType: GameFilter;
    profitLoss: ProfitLossFilter;
    date: string;
  } = { gameType: 'any', profitLoss: 'any', date: '' };

  const baseProps = {
    filters: baseFilters,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    mockUseGameTypes.mockReset();
    baseProps.onChange.mockReset();
  });

  it('renders game type options from hook', () => {
    mockUseGameTypes.mockReturnValue(
      createGameTypesResult({
        data: [
          { id: 'texas', label: "Texas Hold'em" },
          { id: 'omaha', label: 'Omaha' },
        ],
        isLoading: false,
        error: null,
      }),
    );
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
    mockUseGameTypes.mockReturnValue(
      createGameTypesResult({
        data: [],
        isLoading: true,
        error: null,
      }),
    );
    render(<FilterDropdown {...baseProps} />);
    const select = screen.getAllByRole('combobox')[0];
    expect(select).toBeDisabled();
  });

  it('renders only default option when empty', () => {
    mockUseGameTypes.mockReturnValue(
      createGameTypesResult({
        data: [],
        isLoading: false,
        error: null,
      }),
    );
    render(<FilterDropdown {...baseProps} />);
    const select = screen.getAllByRole('combobox')[0];
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Any');
  });

  it('shows error message when fetching fails', () => {
    mockUseGameTypes.mockReturnValue(
      createGameTypesResult({
        data: undefined,
        isLoading: false,
        error: new Error('fail'),
      }),
    );
    render(<FilterDropdown {...baseProps} />);
    expect(screen.getByText(/failed to load game types/i)).toBeInTheDocument();
  });

  it('calls onChange when applying filters', async () => {
    mockUseGameTypes.mockReturnValue(
      createGameTypesResult({
        data: [],
        isLoading: false,
        error: null,
      }),
    );
    render(<FilterDropdown {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(baseProps.onChange).toHaveBeenCalled();
  });

  it('resets filters on reset click', async () => {
    mockUseGameTypes.mockReturnValue(
      createGameTypesResult({
        data: [],
        isLoading: false,
        error: null,
      }),
    );
    render(<FilterDropdown {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(baseProps.onChange).toHaveBeenCalledWith({
      gameType: 'any',
      profitLoss: 'any',
      date: '',
    });
  });
});
