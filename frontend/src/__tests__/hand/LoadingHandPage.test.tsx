import { render } from '@testing-library/react';
import LoadingHandPage from '@/app/(site)/hand/[id]/loading';
import { useHandState } from '@/hooks/useHandState';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useSearchParams: () => new URLSearchParams('frame=5'),
}));

jest.mock('@/hooks/useHandState');

describe('LoadingHandPage', () => {
  it('uses frame query param when calling useHandState', () => {
    (useHandState as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    });
    render(<LoadingHandPage />);
    expect(useHandState).toHaveBeenCalledWith('1', 5);
  });
});
