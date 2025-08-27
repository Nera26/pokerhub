import { render, screen } from '@testing-library/react';
import ActivityLineChart from '@/app/components/dashboard/charts/ActivityLineChart';

const chartMock = jest.fn((..._args: unknown[]) => ({ destroy: jest.fn() }));
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: chartMock,
}));

describe('ActivityLineChart', () => {
  it('renders with accessible name and updates when data changes', async () => {
    const { rerender } = render(
      <ActivityLineChart data={[1, 2, 3, 4, 5, 6, 7]} />,
    );

    await screen.findByRole('img', { name: /activity/i });
    expect(chartMock).toHaveBeenCalledTimes(1);
    type ChartConfig = {
      data: { datasets: { label: string; data: number[] }[] };
    };
    let config = chartMock.mock.calls[0]![1] as ChartConfig;
    expect(config.data.datasets[0].label).toBe('Active Players');

    rerender(<ActivityLineChart data={[7, 6, 5, 4, 3, 2, 1]} />);
    await screen.findByRole('img', { name: /activity/i });
    expect(chartMock).toHaveBeenCalledTimes(2);
    config = chartMock.mock.calls[1]![1] as ChartConfig;
    expect(config.data.datasets[0].data).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });
});
