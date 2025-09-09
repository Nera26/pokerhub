import { render } from '@testing-library/react';
import RevenueDonut, { type RevenueStream } from '../RevenueDonut';

const useChartMock = jest.fn();
jest.mock('@/lib/useChart', () => ({
  useChart: (config: unknown) => {
    useChartMock(config);
    return { ref: { current: null }, ready: true };
  },
}));

describe('RevenueDonut', () => {
  it('renders dynamic labels from streams', () => {
    const streams: RevenueStream[] = [
      { label: 'Cash', pct: 50, value: 5000 },
      { label: 'Tournaments', pct: 30, value: 3000 },
      { label: 'Rake', pct: 20, value: 2000 },
    ];
    render(<RevenueDonut streams={streams} />);
    const config = useChartMock.mock.calls[0][0] as {
      data: { labels: string[]; datasets: { data: number[] }[] };
    };
    expect(config.data.labels).toEqual(streams.map((s) => s.label));
    expect(config.data.datasets[0].data).toEqual(streams.map((s) => s.pct));
  });
});
