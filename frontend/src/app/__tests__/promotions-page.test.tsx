import { render, screen, fireEvent } from '@testing-library/react';
import PromotionsPage from '@/app/promotions/page';
import { usePromotions } from '@/hooks/usePromotions';
import { claimPromotion } from '@/lib/api/promotions';

jest.mock('@/hooks/usePromotions', () => ({
  __esModule: true,
  usePromotions: jest.fn(),
}));
jest.mock('@/lib/api/promotions', () => ({
  claimPromotion: jest.fn(),
}));

const mockUsePromotions = usePromotions as jest.MockedFunction<
  typeof usePromotions
>;
const mockClaimPromotion = claimPromotion as jest.MockedFunction<
  typeof claimPromotion
>;

const promotion = {
  id: '1',
  category: 'daily',
  title: 'Daily Reward',
  description: 'Play one game',
  reward: '$10',
  unlockText: 'Play once',
  breakdown: [],
};

describe('PromotionsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state', () => {
    mockUsePromotions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);
    render(<PromotionsPage />);
    expect(screen.getByText('Loading promotions...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUsePromotions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    render(<PromotionsPage />);
    expect(screen.getByText('No promotions available')).toBeInTheDocument();
  });

  it('renders promotions on success', async () => {
    mockUsePromotions.mockReturnValue({
      data: [promotion],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    render(<PromotionsPage />);
    expect(await screen.findByText('Daily Reward')).toBeInTheDocument();
  });

  it('shows claim error', async () => {
    mockUsePromotions.mockReturnValue({
      data: [promotion],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    mockClaimPromotion.mockRejectedValue(new Error('fail'));
    render(<PromotionsPage />);
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('fail');
  });
});
