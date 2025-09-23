import { render, screen, fireEvent } from '@testing-library/react';
import PromotionsPage from '@/app/promotions/page';
import { usePromotions } from '@/hooks/usePromotions';
import useToasts from '@/hooks/useToasts';
import { claimPromotion } from '@/lib/api/promotions';

jest.mock('@/hooks/usePromotions', () => ({
  __esModule: true,
  usePromotions: jest.fn(),
}));
jest.mock('@/lib/api/promotions', () => ({
  claimPromotion: jest.fn(),
}));
jest.mock('@/hooks/useToasts', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUsePromotions = usePromotions as jest.MockedFunction<
  typeof usePromotions
>;
const mockClaimPromotion = claimPromotion as jest.MockedFunction<
  typeof claimPromotion
>;
const mockUseToasts = useToasts as jest.MockedFunction<typeof useToasts>;
const pushToast = jest.fn();

const promotion = {
  id: '1',
  category: 'daily',
  title: 'Daily Reward',
  description: 'Play one game',
  reward: '$10',
  breakdown: [],
};

describe('PromotionsPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    pushToast.mockReset();
    mockUseToasts.mockReturnValue({ toasts: [], pushToast });
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
    mockClaimPromotion.mockResolvedValue({ message: 'claimed' });
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
    mockClaimPromotion.mockRejectedValue({
      message: 'Failed to claim promotion: fail',
    });
    render(<PromotionsPage />);
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to claim promotion: fail',
    );
  });

  it('opens modal with promotion details on click', async () => {
    global.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(cb, 0);
    mockUsePromotions.mockReturnValue({
      data: [promotion],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    render(<PromotionsPage />);
    fireEvent.click(screen.getByText('Daily Reward'));
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Daily Reward' }),
    ).toBeInTheDocument();
  });
});
