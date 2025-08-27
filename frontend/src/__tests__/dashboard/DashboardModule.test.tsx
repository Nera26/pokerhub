import { render, screen } from '@testing-library/react';
import DashboardModule from '@/app/components/dashboard/DashboardModule';

describe('DashboardModule', () => {
  it('renders error fallback when component throws', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
      />,
    );
    expect(await screen.findByText('failed')).toBeInTheDocument();
    spy.mockRestore();
  });
});
