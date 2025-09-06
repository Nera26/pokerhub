import { render, screen } from '@testing-library/react';
import DashboardModule from '@/app/components/dashboard/DashboardModule';
import { logger } from '@/lib/logger';

describe('DashboardModule', () => {
  it('renders error fallback when component throws', async () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const loader = () =>
      Promise.resolve({
        default: () => {
          throw new Error('boom');
        },
      });
    render(
      <DashboardModule
        loader={loader}
        loading={<div>loading...</div>}
        error={<div>failed</div>}
      />
    );
    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
