import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableModal from '../TableModal';
import { useGameTypes } from '@/hooks/useGameTypes';

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: jest.fn(),
}));

const mockUseGameTypes = useGameTypes as jest.MockedFunction<
  typeof useGameTypes
>;

const createGameTypesResult = (
  overrides: Record<string, unknown> = {},
): ReturnType<typeof useGameTypes> =>
  ({
    data: [
      { id: 'texas', label: "Texas Hold'em" },
      { id: 'omaha', label: 'Omaha' },
    ],
    isLoading: false,
    error: null,
    ...overrides,
  }) as unknown as ReturnType<typeof useGameTypes>;

const defaultValues = {
  tableName: 'Test Table',
  gameType: 'texas',
  stakes: { small: 1, big: 2 },
  startingStack: 100,
  players: { max: 6 },
  buyIn: { min: 50, max: 200 },
};

const renderModal = () => {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  mockUseGameTypes.mockReturnValue(createGameTypesResult());
  render(
    <TableModal
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      defaultValues={defaultValues}
      title="Create Table"
      submitLabel="Create"
    />,
  );
  return { onSubmit, onClose };
};

describe('TableModal', () => {
  beforeEach(() => {
    mockUseGameTypes.mockReset();
  });

  it('submits form data', async () => {
    const { onSubmit } = renderModal();

    await userEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith(defaultValues, expect.anything());
  });

  it('calls onClose when close button clicked', async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalled();
  });
});
