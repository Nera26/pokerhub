import { render, within } from '@testing-library/react';
import HomeLoadingSkeleton from '@/app/components/home/HomeLoadingSkeleton';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';
import { useGameTypes } from '@/hooks/useGameTypes';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/hooks/useGameTypes');

const mockUseTables = useTables as jest.MockedFunction<typeof useTables>;
const mockUseTournaments = useTournaments as jest.MockedFunction<
  typeof useTournaments
>;
const mockUseCTAs = useCTAs as jest.MockedFunction<typeof useCTAs>;
const mockUseGameTypes = useGameTypes as jest.MockedFunction<
  typeof useGameTypes
>;

describe('HomeLoadingSkeleton', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('falls back to defaults when data is undefined', () => {
    mockUseTables.mockReturnValue({ data: undefined } as any);
    mockUseTournaments.mockReturnValue({ data: undefined } as any);
    mockUseCTAs.mockReturnValue({ data: undefined } as any);
    mockUseGameTypes.mockReturnValue({ data: undefined } as any);

    const { container, getAllByTestId } = render(<HomeLoadingSkeleton />);

    expect(getAllByTestId('cta-skeleton')).toHaveLength(2);
    expect(getAllByTestId('tab-skeleton')).toHaveLength(4);

    const cashSection = container.querySelector(
      '#cash-games-section',
    ) as HTMLElement;
    const tournamentSection = container.querySelector(
      '#tournaments-section',
    ) as HTMLElement;

    expect(within(cashSection).getAllByTestId('skeleton-card')).toHaveLength(3);
    expect(
      within(tournamentSection).getAllByTestId('skeleton-card'),
    ).toHaveLength(3);
  });

  it('renders skeletons based on query sizes', () => {
    mockUseTables.mockReturnValue({ data: Array(5).fill({}) } as any);
    mockUseTournaments.mockReturnValue({ data: Array(2).fill({}) } as any);
    mockUseCTAs.mockReturnValue({ data: Array(3).fill({}) } as any);
    mockUseGameTypes.mockReturnValue({ data: Array(6).fill({}) } as any);

    const { container, getAllByTestId } = render(<HomeLoadingSkeleton />);

    expect(getAllByTestId('cta-skeleton')).toHaveLength(3);
    expect(getAllByTestId('tab-skeleton')).toHaveLength(6);

    const cashSection = container.querySelector(
      '#cash-games-section',
    ) as HTMLElement;
    const tournamentSection = container.querySelector(
      '#tournaments-section',
    ) as HTMLElement;

    expect(within(cashSection).getAllByTestId('skeleton-card')).toHaveLength(5);
    expect(
      within(tournamentSection).getAllByTestId('skeleton-card'),
    ).toHaveLength(2);
  });
});
