import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseQuery = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

const fetchPromotions = jest.fn();
const claimPromotion = jest.fn();

jest.mock('@/lib/api/promotions', () => ({
  fetchPromotions: (...args: any[]) => fetchPromotions(...args),
  claimPromotion: (...args: any[]) => claimPromotion(...args),
}));

jest.mock(
  '../../components/promotions/PromotionCard',
  () =>
    ({ promotion }: any) => (
      <div>
        <span>{promotion.title}</span>
        <button onClick={promotion.onAction}>Claim</button>
      </div>
    ),
);

describe('PromotionsPage', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    fetchPromotions.mockReset();
    claimPromotion.mockReset();
  });

  it('fetches promotions on render', async () => {
    mockUseQuery.mockImplementation(({ queryFn }: any) => {
      queryFn({});
      return { data: [] };
    });
    const { default: PromotionsPage } = await import('../page');
    render(<PromotionsPage />);
    expect(fetchPromotions).toHaveBeenCalled();
  });

  it('renders promotions and claims on action', async () => {
    const promos = [
      {
        id: '1',
        category: 'daily',
        title: 'Daily Bonus',
        description: 'Play',
        reward: '$10',
        breakdown: [],
      },
    ];
    mockUseQuery.mockReturnValue({ data: promos });
    const { default: PromotionsPage } = await import('../page');
    render(<PromotionsPage />);
    expect(screen.getByText('Daily Bonus')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(claimPromotion).toHaveBeenCalledWith('1');
  });

  it('shows error when fetching promotions fails', async () => {
    mockUseQuery.mockReturnValue({ error: { message: 'oops' } });
    const { default: PromotionsPage } = await import('../page');
    render(<PromotionsPage />);
    expect(screen.getByText('oops')).toBeInTheDocument();
  });
});
