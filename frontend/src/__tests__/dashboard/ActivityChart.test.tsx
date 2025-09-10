import { render, screen } from '@testing-library/react';
import ActivityChart from '@/app/components/dashboard/charts/ActivityChart';

const chartMock = jest.fn((..._args: unknown[]) => ({ destroy: jest.fn() }));
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: chartMock,
}));

describe('ActivityChart', () => {
  beforeEach(() => {
    chartMock.mockClear();
  });
  const labels = [
    '00:00',
    '04:00',
    '08:00',
    '12:00',
    '16:00',
    '20:00',
    '24:00',
  ];

  it('shows loading state before chart is ready', () => {
    render(<ActivityChart labels={labels} data={[1, 2, 3, 4, 5, 6, 7]} />);
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument();
  });

  it('renders a message when no data is provided', () => {
    render(<ActivityChart />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('renders with accessible name and updates when data changes', async () => {
    const { rerender } = render(
      <ActivityChart labels={labels} data={[1, 2, 3, 4, 5, 6, 7]} />,
    );

    await screen.findByRole('img', { name: /activity/i });
    expect(chartMock).toHaveBeenCalledTimes(1);
    type ChartConfig = {
      data: { labels: string[]; datasets: { label: string; data: number[] }[] };
    };
    let config = chartMock.mock.calls[0]![1] as ChartConfig;
    expect(config.data.datasets[0].label).toBe('Active Players');
    expect(config.data.labels).toEqual(labels);

    rerender(<ActivityChart labels={labels} data={[7, 6, 5, 4, 3, 2, 1]} />);
    await screen.findByRole('img', { name: /activity/i });
    expect(chartMock).toHaveBeenCalledTimes(2);
    config = chartMock.mock.calls[1]![1] as ChartConfig;
    expect(config.data.datasets[0].data).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });
});
